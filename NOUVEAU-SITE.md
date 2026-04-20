# Créer un nouveau site vitrine — Guide complet

Stack : HTML + CSS vanilla + AOS + Fraunces/Inter  
Hébergement : VPS `streammate.ai` (root) — `servicecompris.pro/<dossier>` ou domaine propre  
Repo : `github.com/thesakia/servicecompris`

---

## 1. Collecte d'infos client

Avant de toucher au code, récupérer :

**Identité**
- Nom, adresse, téléphone, horaires
- Instagram, Facebook, Google Maps (lien direct)

**Positionnement** (questions à poser au client)
- Si votre établissement était une personne, ce serait qui ?
- Ce qui vous différencie vraiment des autres ?
- Quel sentiment doit ressentir le visiteur en arrivant ?
- Codes visuels à éviter absolument ?

**Contenu**
- Qu'est-ce qui doit apparaître en premier ?
- Carte : affichée sur le site ou PDF ? Change souvent ?
- Photos disponibles ou on part de zéro ?
- Une anecdote ou histoire à raconter ?
- Ton de communication (vouvoiement, tutoiement, décontracté, formel) ?

**Sources à consulter**
- Instagram du client (photos, ambiance, posts)
- Google Maps (photos clients, avis verbatim)
- Tripadvisor, Restaurantguru (avis, infos)
- Pages Jaunes / Firmania (horaires, contact)

> Pour les avis : ne jamais inventer. Récupérer des extraits verbatim depuis Google Maps / Restaurantguru.  
> Pour les photos : utiliser les vraies si disponibles. Les CDN publics (restaurantguru, tripadvisor) sont utilisables directement en `<img src="">` ou à télécharger localement.

---

## 2. Structure locale

Créer un dossier dans `A:\DEV\servicecompris\` :

```
servicecompris/
└── nomclient/
    ├── index.html
    ├── img/
    │   ├── favicon.svg
    │   └── photo-1.jpg ...
    ├── css/
    │   └── aos.min.css
    └── js/
        └── aos.min.js
```

**Récupérer AOS :**
```bash
curl -s "https://unpkg.com/aos@2.3.4/dist/aos.css" -o css/aos.min.css
curl -s "https://unpkg.com/aos@2.3.4/dist/aos.js"  -o js/aos.min.js
```

---

## 3. Template HTML de base

Copier `307/index.html` comme point de départ et adapter.

**Polices** — choisir selon l'identité du client, ne pas réutiliser la même que Philip ou 307 :

| Ambiance | Titres (--hf) | Corps (--bf) |
|---|---|---|
| Gastronomique / classique | EB Garamond | EB Garamond |
| Convivial / moderne | Fraunces | Inter |
| Contemporain / urbain | DM Serif Display | DM Sans |
| Nature / bio | Playfair Display | Lato |

Lien Google Fonts à placer dans `<head>` :
```html
<link href="https://fonts.googleapis.com/css2?family=XXXX&display=swap"
      rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="..." rel="stylesheet"></noscript>
```

**Variables CSS à adapter systématiquement :**
```css
:root {
  --bg:        /* fond principal */
  --bg2:       /* fond sections alternées */
  --text:      /* texte principal */
  --muted:     /* texte secondaire */
  --accent:    /* couleur principale (boutons, labels) */
  --gold:      /* couleur secondaire (dividers, prix) */
  --btn:       /* couleur bouton */
  --btn-hover: /* couleur bouton hover */
  --hf:        /* police titres */
  --bf:        /* police corps */
}
```

**Règles de rédaction :**
- Pas d'emoji dans le HTML
- Pas de tirets cadratin (`—` ou `&mdash;`) — utiliser `,` `:` `(` `)` ou `.`
- Ton adapté au client (tutoiement si demandé)

**Sections standard :**
1. Header fixe + nav + burger mobile
2. Hero plein écran (fond CSS ou image)
3. Cadre / ambiance (galerie mosaïque)
4. Carte / menu (tabs animés)
5. Histoire (texte + citation)
6. Avis clients (vrais, shuffle JS)
7. Social (Instagram + Facebook)
8. Infos pratiques (carte OpenStreetMap + horaires + chips)
9. Footer

---

## 4. Déploiement initial sur le VPS

**SSH :**
```
Host : streammate.ai
User : root
Pass : AxY,7pP4Kxx#4J7
```

Config `~/.ssh/config` (si pas encore fait) :
```
Host servicecompris
    HostName streammate.ai
    User root
```

**Upload des fichiers** (depuis le dossier local du client) :
```bash
# Créer le dossier sur le VPS
ssh root@streammate.ai "mkdir -p /var/www/servicecompris/nomclient"

# Uploader
scp -r index.html css/ js/ img/ root@streammate.ai:/var/www/servicecompris/nomclient/
```

Le site est immédiatement accessible sur `https://servicecompris.pro/nomclient/`

> Nginx est déjà configuré pour servir tout ce qui est dans `/var/www/servicecompris/`.  
> Pas besoin de toucher à Nginx pour un sous-chemin `servicecompris.pro/nomclient/`.

---

## 5. Domaine propre (optionnel)

Si le client a (ou aura) son propre domaine :

**a. DNS chez le registrar du client**
```
A    @      <IP du VPS>
A    www    <IP du VPS>
```
IP du VPS : vérifier avec `ssh root@streammate.ai "curl -s ifconfig.me"`

**b. Nginx + SSL via le script `add-site.sh`**

Le script est sur le VPS à `/var/www/servicecompris/add-site.sh`.  
Il vérifie le DNS, crée la config Nginx, génère le SSL Let's Encrypt, et débloque l'accès.

```bash
# S'assurer que les fichiers sont déjà uploadés, puis :
ssh root@streammate.ai "cd /var/www/servicecompris && bash add-site.sh domaine-client.fr nomclient"
```

Le script fait tout :
- Crée `/etc/nginx/sites-available/domaine-client.fr`
- Active le vhost
- Lance Certbot (SSL automatique)
- Débloque `servicecompris.pro/nomclient/` dans la config principale

---

## 6. Umami Analytics

Instance : `https://analytics.servicecompris.pro`  
Credentials : `admin` / `umami`

**Créer le site via l'API :**
```bash
# 1. Login
TOKEN=$(curl -s -X POST "https://analytics.servicecompris.pro/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"umami"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 2. Créer le site
curl -s -X POST "https://analytics.servicecompris.pro/api/websites" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Nom du client","domain":"domaine-client.fr"}'
# => retourne un "id" : c'est le WEBSITE_ID
```

**Injecter dans le HTML** (avant `</body>`) :
```html
<script defer src="https://analytics.servicecompris.pro/script.js"
        data-website-id="WEBSITE_ID_ICI"></script>
```

> Utiliser toujours l'instance self-hosted `analytics.servicecompris.pro`, pas `cloud.umami.is`.

---

## 7. Git

Le repo est `github.com/thesakia/servicecompris`. Chaque client est un sous-dossier.

**Ajouter le nouveau site au repo :**
```bash
cd A:/DEV/servicecompris
git add nomclient/
git commit -m "Ajout site vitrine NomClient"
git push origin main
```

**Déploiement rapide après modifications :**
```bash
# Depuis le dossier local du client
scp -r index.html img/ css/ js/ root@streammate.ai:/var/www/servicecompris/nomclient/
```

Ou créer un `deploy.sh` dans le dossier client :
```bash
#!/bin/bash
SERVER="root@streammate.ai"
REMOTE="/var/www/servicecompris/nomclient"
LOCAL="$(dirname "$0")"

rsync -avz --delete \
  --exclude='.git' --exclude='.claude' --exclude='deploy.sh' \
  "$LOCAL/" "$SERVER:$REMOTE/"

echo "Done -> https://servicecompris.pro/nomclient"
```

---

## 8. Checklist de lancement

- [ ] Infos client collectées (adresse, tel, horaires, réseaux)
- [ ] Photos récupérées (vraies, pas de stock)
- [ ] Avis clients : verbatim réels uniquement
- [ ] Pas d'emoji dans le HTML
- [ ] Pas de tirets cadratin
- [ ] Police différente des autres sites (Philip = EB Garamond, 307 = Fraunces/Inter)
- [ ] Umami configuré et script injecté
- [ ] Schema.org JSON-LD renseigné (nom, adresse, horaires, téléphone)
- [ ] Meta description et OG tags renseignés
- [ ] Favicon SVG créé
- [ ] Test mobile (burger menu, taille police, bouton CTA fixe)
- [ ] Horaires : highlight "aujourd'hui" fonctionnel
- [ ] Fichiers uploadés sur le VPS
- [ ] Site vérifié en ligne
- [ ] Committé et pushé sur GitHub
- [ ] DNS configuré si domaine propre
- [ ] `add-site.sh` lancé si domaine propre (SSL)

---

## Référence rapide

| Quoi | Valeur |
|---|---|
| VPS | `root@streammate.ai` |
| Web root | `/var/www/servicecompris/` |
| Repo GitHub | `github.com/thesakia/servicecompris` |
| Umami | `https://analytics.servicecompris.pro` — `admin` / `umami` |
| Script add-site | `ssh root@streammate.ai "bash /var/www/servicecompris/add-site.sh DOMAINE DOSSIER"` |
| Modèle de site | `307/` (Fraunces/Inter, convivial) ou `philip/` (EB Garamond, gastronomique) |
