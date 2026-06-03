# Deploying Retirement360 to Hetzner

Two supported paths. Pick one.

## Option A — Docker Compose on a single Hetzner VPS (recommended, auto-HTTPS)

This uses `deploy/docker-compose.prod.yml` + **Caddy**, which fetches and renews a free
Let's Encrypt TLS cert automatically — no manual certbot steps.

**0. Buy the two things (one-time):**
   - A **Hetzner Cloud** server: https://www.hetzner.com/cloud → Ubuntu 24.04, type **CX22**.
     Add your SSH key during creation. Note the **IP**.
   - A **domain** (Namecheap/Cloudflare/GoDaddy). Add a DNS **A record** pointing your
     domain (e.g. `app.yourname.com`) at the server **IP**.

**1. Bootstrap the server** (installs Docker, firewall, deploy user):
   ```bash
   ssh root@YOUR_HETZNER_IP 'bash -s' < deploy/hetzner/setup-server.sh
   ```

**2. Create `backend/.env` on the server** (from `backend/.env.example`) with at least:
   ```ini
   DOMAIN=app.yourname.com
   CADDY_EMAIL=you@email.com
   GEMINI_API_KEY=AIza...
   POSTGRES_PASSWORD=a-strong-password
   ```

**3. Deploy from your laptop:**
   ```bash
   RETIRE360_SERVER=deploy@YOUR_HETZNER_IP ./deploy/hetzner/deploy.sh
   ```

**4. Wait ~1 min for DNS + cert**, then open **https://app.yourname.com** 🎉

`ssh root@YOUR_HETZNER_IP` is your remote-management key — the "SSH" box in the diagram.
Caddy is the "Nginx gateway" box; it also handles TLS.

## Option B — Kubernetes (Hetzner managed k8s or k3s on a VPS)

1. Install **k3s** on the server (`curl -sfL https://get.k3s.io | sh -`) or use Hetzner's managed cluster.
2. Build & push images to a registry (GHCR/Docker Hub), then set the image names in
   `deploy/k8s/03-backend.yaml` and `04-frontend.yaml`.
3. Apply manifests:
   ```bash
   cp deploy/k8s/01-secrets.example.yaml deploy/k8s/01-secrets.yaml   # fill in real values
   kubectl apply -f deploy/k8s/
   ```
4. Install `ingress-nginx` + `cert-manager` for the Ingress in `05-ingress.yaml` to get TLS.

The `HorizontalPodAutoscaler` in `03-backend.yaml` is the "Kubernetes auto-scales when more
users join" piece from the diagram (scales 2→10 backend pods at 70% CPU).
