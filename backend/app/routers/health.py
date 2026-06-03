"""Health & readiness probes (used by Docker, Kubernetes, and the load balancer)."""
from fastapi import APIRouter
from sqlalchemy import text

from ..database import engine

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    return {"status": "ok"}


@router.get("/ready")
def ready() -> dict:
    """Readiness probe — verifies the database is reachable."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ready", "database": "up"}
    except Exception as exc:  # pragma: no cover - surfaced to k8s
        return {"status": "degraded", "database": "down", "detail": str(exc)}
