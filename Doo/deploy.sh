#!/bin/bash
SERVER="root@streammate.ai"
REMOTE="/var/www/servicecompris/doo"
LOCAL="$(dirname "$0")"

rsync -avz --delete \
  --exclude='.git' --exclude='.claude' --exclude='deploy.sh' \
  "$LOCAL/" "$SERVER:$REMOTE/"

echo "Done -> https://servicecompris.pro/doo"
