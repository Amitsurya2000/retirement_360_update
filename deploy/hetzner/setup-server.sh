#!/usr/bin/env bash
# One-time Hetzner server bootstrap. Run as root on a fresh Ubuntu 24.04 box:
#   ssh root@YOUR_HETZNER_IP 'bash -s' < deploy/hetzner/setup-server.sh
set -euo pipefail

echo "==> Updating system"
apt-get update && apt-get upgrade -y

echo "==> Installing Docker + Compose plugin"
curl -fsSL https://get.docker.com | sh
apt-get install -y docker-compose-plugin ufw fail2ban

echo "==> Firewall (allow SSH + HTTP + HTTPS only)"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Creating deploy user + app dir"
id -u deploy &>/dev/null || useradd -m -s /bin/bash deploy
usermod -aG docker deploy
mkdir -p /opt/retire360
chown -R deploy:deploy /opt/retire360

echo "==> Done. Next: copy the repo to /opt/retire360 and run deploy.sh"
