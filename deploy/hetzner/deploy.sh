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
# backend/.env must exist on the server with DOMAIN, CADDY_EMAIL, GEMINI_API_KEY.
if [ ! -f backend/.env ]; then
  echo "ERROR: backend/.env missing on server — create it from backend/.env.example" >&2
  exit 1
fi
set -a; . backend/.env; set +a   # export DOMAIN, CADDY_EMAIL, GEMINI_API_KEY, etc.
if [ -z "${DOMAIN:-}" ]; then
  echo "ERROR: DOMAIN not set in backend/.env (needed for the HTTPS cert)" >&2
  exit 1
fi
docker compose -f deploy/docker-compose.prod.yml up -d --build
docker compose -f deploy/docker-compose.prod.yml ps
REMOTE

echo "==> Deployed. Once DNS points at the server, visit https://YOUR_DOMAIN (Caddy gets the cert automatically)."
