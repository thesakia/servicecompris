#!/bin/bash
SERVER="${1:-monvps}"
REMOTE="/var/www/ftfenaux/servicecompris/philip"
LOCAL="$(dirname "$0")"

rsync -avz --delete \
  --exclude='.git' --exclude='.claude' --exclude='deploy.sh' \
  "$LOCAL/" "$SERVER:$REMOTE/"

echo "Done -> https://ftfenaux.com/servicecompris/philip/"
