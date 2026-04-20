#!/bin/bash
# Deploy script - Bar Restaurant 307
# Usage: ./deploy.sh [ssh_alias_or_user@host]
# Exemple: ./deploy.sh servicecompris
# Prerequis: SSH key configuree, acces au VPS

SERVER="${1:-servicecompris}"
REMOTE_PATH="/var/www/servicecompris.pro/307"
LOCAL_PATH="$(dirname "$0")"

echo "Deploiement vers $SERVER:$REMOTE_PATH"
rsync -avz --delete \
  --exclude='.git' \
  --exclude='.claude' \
  --exclude='deploy.sh' \
  "$LOCAL_PATH/" "$SERVER:$REMOTE_PATH/"

echo "Done -> https://servicecompris.pro/307"
