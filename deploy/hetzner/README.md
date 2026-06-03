# Deploying Retirement360 to Hetzner

Two supported paths. Pick one.

## Option A — Docker Compose on a single Hetzner VPS (simplest)

1. Create a Hetzner Cloud server (CX22 / Ubuntu 24.04 is plenty to start). Note its IP.
2. Add your SSH key, then bootstrap it:
   ```bash
   ssh root@YOUR_HETZNER_IP 'bash -s' < deploy/hetzner/setup-server.sh
   ```
3. On the server, create `backend/.env` (from `backend/.env.example`) with your real `GEMINI_API_KEY`.
4. From your laptop, deploy:
   ```bash
   RETIRE360_SERVER=deploy@YOUR_HETZNER_IP ./deploy/hetzner/deploy.sh
   ```
5. Add TLS: put **Caddy** or **Certbot+Nginx** in front, or point Cloudflare at the server.

`ssh root@YOUR_HETZNER_IP` is your remote-management key — exactly the "SSH" box in the architecture diagram.

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
