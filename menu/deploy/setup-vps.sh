#!/bin/bash
# ─── QRMenu — Setup VPS (servicecompris.fr/menu) ──────────────────────────────
# Usage (sur le VPS en root) : bash setup-vps.sh
#
# Ce script :
#   1. Crée /var/www/servicecompris/menu/
#   2. Crée le repo Git bare /opt/qrmenu-repo.git + hook post-receive
#   3. Installe PocketBase (binaire direct, pas Docker)
#   4. Crée un service systemd pour PocketBase
#   5. Ajoute location /menu/ dans la config Nginx servicecompris
#   6. Proxy /menu/api/ → PocketBase (port 8090)
set -e

DEPLOY_DIR="/var/www/servicecompris/menu"
REPO_DIR="/opt/qrmenu-repo.git"
PB_DIR="/opt/pocketbase"
PB_PORT="8090"
NGINX_CONF="/etc/nginx/sites-available/servicecompris"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   QRMenu — Installation sur servicecompris.fr   ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── 1. Dossier de deploy ──────────────────────────────────────────────────────
echo "[1/5] Création du dossier de deploy…"
mkdir -p "$DEPLOY_DIR"
echo "  ✓ $DEPLOY_DIR"

# ── 2. PocketBase (binaire direct — pas besoin de Docker) ─────────────────────
echo "[2/5] Installation de PocketBase…"
mkdir -p "$PB_DIR/pb_data"

if [ ! -f "$PB_DIR/pocketbase" ]; then
  PB_VERSION="0.22.14"
  ARCH=$(uname -m)
  case $ARCH in
    x86_64)  PB_ARCH="linux_amd64" ;;
    aarch64) PB_ARCH="linux_arm64" ;;
    *)       PB_ARCH="linux_amd64" ;;
  esac

  echo "  Téléchargement PocketBase $PB_VERSION ($PB_ARCH)…"
  curl -sL "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${PB_ARCH}.zip" \
    -o /tmp/pb.zip
  unzip -q /tmp/pb.zip -d "$PB_DIR"
  chmod +x "$PB_DIR/pocketbase"
  rm /tmp/pb.zip
  echo "  ✓ PocketBase installé dans $PB_DIR"
else
  echo "  ✓ PocketBase déjà présent"
fi

# ── 3. Service systemd pour PocketBase ────────────────────────────────────────
echo "[3/5] Configuration du service systemd…"
cat > /etc/systemd/system/qrmenu-pb.service << EOF
[Unit]
Description=QRMenu PocketBase
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$PB_DIR
ExecStart=$PB_DIR/pocketbase serve --http=127.0.0.1:$PB_PORT --dir=$PB_DIR/pb_data
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

chown -R www-data:www-data "$PB_DIR"
systemctl daemon-reload
systemctl enable qrmenu-pb
systemctl restart qrmenu-pb
echo "  ✓ Service qrmenu-pb démarré sur 127.0.0.1:$PB_PORT"

# ── 4. Repo Git bare + hook post-receive ──────────────────────────────────────
echo "[4/5] Création du repo Git bare…"
git init --bare "$REPO_DIR"

cat > "$REPO_DIR/hooks/post-receive" << 'HOOK'
#!/bin/bash
set -e
DEPLOY_DIR="/var/www/servicecompris/menu"
GIT_DIR="/opt/qrmenu-repo.git"
BRANCH="main"

echo ""
echo "══════════════════════════════════════"
echo "  QRMenu — Deploy en cours…"
echo "══════════════════════════════════════"

while read oldrev newrev refname; do
  pushed_branch=$(git rev-parse --symbolic --abbrev-ref "$refname")
  if [ "$pushed_branch" != "$BRANCH" ]; then
    echo "  Branch '$pushed_branch' ignorée (only '$BRANCH' deploys)"
    exit 0
  fi
done

echo "--> Checkout du code vers $DEPLOY_DIR"
git --work-tree="$DEPLOY_DIR" --git-dir="$GIT_DIR" checkout -f "$BRANCH"

echo "--> Rechargement Nginx"
nginx -t && systemctl reload nginx

echo ""
echo "  ✅ Deploy OK !"
echo "  Commit : $(git --git-dir=$GIT_DIR rev-parse --short HEAD)"
echo "  URL    : https://servicecompris.fr/menu/"
echo "══════════════════════════════════════"
echo ""
HOOK

chmod +x "$REPO_DIR/hooks/post-receive"
echo "  ✓ Repo bare : $REPO_DIR"

# ── 5. Nginx : ajout de location /menu/ et proxy API ─────────────────────────
echo "[5/5] Configuration Nginx…"

MARKER="# Tout le reste : protégé"

if grep -q "location /menu/" "$NGINX_CONF"; then
  echo "  ✓ location /menu/ déjà présent dans Nginx"
else
  # Insérer avant le marker habituel (comme add-site.sh le fait)
  BLOCK='    # QRMenu\n    location /menu/ {\n        alias /var/www/servicecompris/menu/;\n        index index.html;\n        try_files $uri $uri/ /menu/index.html;\n        location ~* \\.html$ { expires -1; add_header Cache-Control "no-cache"; }\n        location ~* \\.(css|js|png|jpg|webp|svg|woff2)$ { expires 30d; }\n    }\n\n    # QRMenu — PocketBase API\n    location /menu/api/ {\n        proxy_pass http://127.0.0.1:8090/api/;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_http_version 1.1;\n        proxy_set_header Connection "";\n        proxy_buffering off;\n        client_max_body_size 20M;\n    }\n\n    # QRMenu — PocketBase Admin\n    location /menu/_/ {\n        proxy_pass http://127.0.0.1:8090/_/;\n        proxy_set_header Host $host;\n    }\n'

  if grep -q "$MARKER" "$NGINX_CONF"; then
    sed -i "s|$MARKER|$BLOCK\n    $MARKER|" "$NGINX_CONF"
  else
    # Fallback : on ajoute avant la dernière accolade fermante
    sed -i "$ i\\$BLOCK" "$NGINX_CONF"
  fi
  echo "  ✓ Blocs /menu/ ajoutés dans $NGINX_CONF"
fi

nginx -t && systemctl reload nginx
echo "  ✓ Nginx rechargé"

# ── Résumé ────────────────────────────────────────────────────────────────────
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   ✅  Installation terminée !                                ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║"
echo "║  Sur ta machine locale, ajoute le remote Git :"
echo "║"
echo "║    git remote add vps root@${SERVER_IP}:${REPO_DIR}"
echo "║"
echo "║  Premier déploiement :"
echo "║"
echo "║    git push vps main"
echo "║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Admin PocketBase : https://servicecompris.fr/menu/_/"
echo "║  (crée ton compte admin au premier accès)"
echo "║"
echo "║  Ensuite importe deploy/pb_schema.json dans PocketBase"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
