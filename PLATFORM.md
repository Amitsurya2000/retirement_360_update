# Retirement360 Platform (FastAPI · PostgreSQL · Docker · Kubernetes · Nginx · Hetzner)

This is the **"Option B"** architecture from the design diagram — a from-scratch
Python/microservices build. The retirement logic (bucket strategy + Indian senior-citizen
tax) was ported faithfully from the original TypeScript engine.

> The original Next.js app still lives at the repo root (`src/`, `prisma/`, `package.json`)
> as legacy/reference. The platform below is the new project and is self-contained under
> `backend/`, `frontend/`, `mobile/`, and `deploy/`.

## How the diagram maps to this repo

| Diagram component | Where it lives | Status |
|---|---|---|
| 1. Frontend apps (Win/Mac/iOS/Android) | `mobile/` (Flutter, one codebase) | Scaffold — needs platform SDKs to compile |
| 1. Web dashboard | `frontend/` (Vite + React) | ✅ Builds & runs |
| 2. FastAPI backend ("the brain") | `backend/app/` | ✅ Runs, tested |
| 3. Docker | `backend/Dockerfile`, `frontend/Dockerfile` | ✅ |
| 3. docker-compose (full local stack) | `deploy/docker-compose.yml` | ✅ |
| 4. Kubernetes (+ autoscaling) | `deploy/k8s/` (Deployments, StatefulSet, HPA, Ingress) | ✅ Manifests |
| 5. PostgreSQL | `db` service + `02-postgres.yaml` | ✅ |
| 6. AI / recommendation engine | `backend/app/core/calculations.py` + `tax.py` | ✅ Ported |
| 7. LLM (Gemini) | `backend/app/core/advisor.py`, `routers/chat.py` | ✅ Needs API key |
| 8. Nginx gateway | `deploy/nginx/nginx.conf` | ✅ |
| 9. Hetzner server | `deploy/hetzner/` (setup + deploy scripts) | ✅ Scripts — needs a real server |
| 10. SSH | `deploy/hetzner/deploy.sh` (rsync over SSH) | ✅ |
| 11. Claude Code | (built this) | ✅ |

## Quickstart — full stack locally (Docker)

```bash
cp backend/.env.example backend/.env       # add your GEMINI_API_KEY (optional for chat)
export GEMINI_API_KEY=AIza...              # docker-compose reads it from the env
docker compose -f deploy/docker-compose.yml up --build
```
- App (via Nginx gateway): http://localhost
- API docs (Swagger): http://localhost/docs
- The stack = Postgres + FastAPI + frontend + Nginx, all wired together.

## Quickstart — backend only (no Docker)

```bash
cd backend
python -m venv .venv && .venv/Scripts/activate    # (Windows) or: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                               # set DATABASE_URL + GEMINI_API_KEY
uvicorn app.main:app --reload
```
- API: http://localhost:8000  ·  docs: http://localhost:8000/docs
- For a quick run without Postgres, set `DATABASE_URL=sqlite:///./dev.db` in `.env`.

## Quickstart — web frontend (dev)

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173 — proxies /api to localhost:8000
```

## API surface

| Method | Path | Purpose |
|---|---|---|
| GET  | `/api/health`, `/api/ready` | Liveness / readiness probes |
| POST | `/api/profiles` | Create a retirement profile |
| GET/PUT/DELETE | `/api/profiles/{id}` | Read / update / delete |
| POST | `/api/plan` | Generate a plan from raw inputs |
| GET  | `/api/plan/{profile_id}` | Generate a plan for a saved profile |
| POST | `/api/tax/compare` | Old vs new regime tax comparison |
| POST | `/api/chat` | Streaming AI advisor (Gemini), grounded in the plan |

## Deploying to Hetzner
See [`deploy/hetzner/README.md`](deploy/hetzner/README.md) — Docker Compose (single VPS)
or Kubernetes (k3s / managed) paths.

## What still needs *you* (can't be finished from a Windows dev box alone)
- **iOS app**: requires macOS + Xcode to build (Apple restriction).
- **Hetzner deploy**: needs a real server IP + domain + DNS, then run the scripts.
- **TLS**: add Caddy/Certbot (Compose) or cert-manager (K8s) for HTTPS.
- **GEMINI_API_KEY**: free from https://aistudio.google.com/apikey — required for the chat.

> ⚠ Educational guidance, not investment advice.
