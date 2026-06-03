#!/usr/bin/env bash
# Deploy / update Retirement360 on the Hetzner server via the docker-compose stack.
# Run from your laptop after editing the variables below.
#
#   ./deploy/hetzner/deploy.sh
#
# It rsyncs the repo to the server and (re)builds the stack. Idempotent — safe to re-run.
set -euo pipefail

SERVER="${RETIRE360_SERVER:-deploy@YOUR_HETZNER_IP}"
REMOTE_DIR="/opt/retire360"

echo "==> Syncing repo to ${SERVER}:${REMOTE_DIR}"
rsync -az --delete \
  --exclude '.git' --exclude 'node_modules' --exclude '.venv' \
  --exclude 'frontend/dist' --exclude 'backend/__pycache__' \
  ./ "${SERVER}:${REMOTE_DIR}/"

echo "==> Building & restarting the stack on the server"
ssh "${SERVER}" bash -se <<'REMOTE'
set -euo pipefail
cd /opt/retire360
# backend/.env must exist on the server with the real GEMINI_API_KEY.
if [ ! -f backend/.env ]; then
  echo "ERROR: backend/.env missing on server — create it from backend/.env.example" >&2
  exit 1
fi
export $(grep -v '^#' backend/.env | xargs)
docker compose -f deploy/docker-compose.yml pull || true
docker compose -f deploy/docker-compose.yml up -d --build
docker compose -f deploy/docker-compose.yml ps
REMOTE

echo "==> Deployed. Visit http://YOUR_HETZNER_IP (add TLS via Caddy/Certbot for production)."
