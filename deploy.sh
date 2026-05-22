#!/bin/bash
SERVER="${1:-monvps}"
REMOTE="/var/www/ftfenaux/servicecompris"
LOCAL="$(dirname "$0")"

rsync -avz --delete \
  --exclude='.git' --exclude='.claude' --exclude='deploy.sh' \
  --exclude='philip' --exclude='doo' --exclude='Doo' \
  "$LOCAL/" "$SERVER:$REMOTE/"

echo "Done -> https://ftfenaux.com/servicecompris/"
