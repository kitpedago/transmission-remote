#!/bin/bash
# Deploy to VPS
set -e

VPS="debian@51.75.141.221"
APP_DIR="/opt/transmission-remote"

echo "==> Syncing files to VPS..."
rsync -avz --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude .claude \
  --exclude 'server/data/*.db*' \
  --exclude client/dist \
  --exclude server/dist \
  --exclude client/node_modules \
  --exclude server/node_modules \
  ./ "$VPS:$APP_DIR/"

echo "==> Building and starting on VPS..."
ssh "$VPS" "cd $APP_DIR && docker compose up -d --build"

echo "==> Done! App running at http://51.75.141.221:8080"
