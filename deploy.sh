#!/bin/bash
# Deploy to VPS (OVH debian@51.75.141.221)
set -e

VPS="debian@51.75.141.221"
APP_DIR="/opt/transmission-remote"

echo "==> Pulling latest code on VPS..."
ssh "$VPS" "cd $APP_DIR && git pull"

echo "==> Installing dependencies..."
ssh "$VPS" "cd $APP_DIR && npm install"

echo "==> Building..."
ssh "$VPS" "cd $APP_DIR && npm run build"

echo "==> Restarting service..."
ssh "$VPS" "sudo systemctl restart transmission-remote"

echo "==> Done! App running at http://51.75.141.221:8181"
