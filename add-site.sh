#!/bin/bash
# Usage: ./add-site.sh <domaine> <dossier>
# Ex:    ./add-site.sh restaurant-philip.fr philip

set -e

DOMAIN=$1
FOLDER=$2
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
SERVICECOMPRIS_CONF="/etc/nginx/sites-available/servicecompris"
WWW_ROOT="/var/www/servicecompris/$FOLDER"

# ── Vérifications ──────────────────────────────────────────────────────────────
if [ -z "$DOMAIN" ] || [ -z "$FOLDER" ]; then
  echo "Usage: $0 <domaine> <dossier>"
  echo "Ex:    $0 restaurant-philip.fr philip"
  exit 1
fi

if [ "$EUID" -ne 0 ]; then
  echo "Ce script doit être lancé en root."
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Nouveau site : $DOMAIN"
echo "  Dossier VPS  : $WWW_ROOT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. Vérifier que le dossier existe ─────────────────────────────────────────
if [ ! -d "$WWW_ROOT" ]; then
  echo "⚠️  Le dossier $WWW_ROOT n'existe pas sur le VPS."
  echo "    Déploie les fichiers du site dans ce dossier d'abord, puis relance le script."
  exit 1
fi
echo "✓ Dossier trouvé : $WWW_ROOT"

# ── 2. Vérifier que le DNS pointe bien vers ce serveur ────────────────────────
SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short "$DOMAIN" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
WWW_IP=$(dig +short "www.$DOMAIN" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)

echo ""
echo "IP du serveur   : $SERVER_IP"
echo "IP $DOMAIN : $DOMAIN_IP"
echo "IP www.$DOMAIN : $WWW_IP"
echo ""

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
  echo "⚠️  $DOMAIN ne pointe pas encore vers ce serveur ($SERVER_IP)."
  echo "    Configure le DNS chez ton registrar, attends la propagation, puis relance."
  exit 1
fi
echo "✓ DNS OK"

# ── 3. Créer la config Nginx ───────────────────────────────────────────────────
if [ -f "$NGINX_CONF" ]; then
  echo "✓ Config Nginx déjà existante, on la conserve."
else
  cat > "$NGINX_CONF" <<EOF
server {
    server_name $DOMAIN www.$DOMAIN;
    root $WWW_ROOT;
    index index.html;

    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF
  echo "✓ Config Nginx créée : $NGINX_CONF"
fi

# ── 4. Activer le site ────────────────────────────────────────────────────────
if [ ! -L "/etc/nginx/sites-enabled/$DOMAIN" ]; then
  ln -s "$NGINX_CONF" "/etc/nginx/sites-enabled/$DOMAIN"
  echo "✓ Site activé dans sites-enabled"
else
  echo "✓ Site déjà activé dans sites-enabled"
fi

nginx -t && systemctl reload nginx
echo "✓ Nginx rechargé"

# ── 5. Certificat SSL ─────────────────────────────────────────────────────────
echo ""
echo "Génération du certificat SSL..."

if [ "$WWW_IP" = "$SERVER_IP" ]; then
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m admin@servicecompris.pro
else
  echo "⚠️  www.$DOMAIN ne pointe pas vers ce serveur, SSL généré sans www."
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@servicecompris.pro
fi
echo "✓ SSL généré"

# ── 6. Débloquer l'accès dans la config servicecompris ────────────────────────
LOCATION_BLOCK="    location /$FOLDER/ {\n        try_files \$uri \$uri/ =404;\n    }"
MARKER="# Tout le reste : protégé"

if grep -q "location /$FOLDER/" "$SERVICECOMPRIS_CONF"; then
  echo "✓ Accès /$FOLDER/ déjà débloqué dans servicecompris"
else
  sed -i "s|$MARKER|# $DOMAIN - accès libre\n$LOCATION_BLOCK\n\n    $MARKER|" "$SERVICECOMPRIS_CONF"
  nginx -t && systemctl reload nginx
  echo "✓ Accès /$FOLDER/ débloqué dans servicecompris"
fi

# ── Résumé ────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Site en ligne !"
echo "  🌐 https://$DOMAIN"
echo "  📁 Fichiers : $WWW_ROOT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
