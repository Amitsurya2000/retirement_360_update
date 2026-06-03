"""Retirement360 API — FastAPI entry point (the retirement logic engine)."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import init_db
from .routers import chat, health, plan, profiles, tax

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Retirement360 — bucket-strategy planning, tax optimisation, and an AI advisor.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (health.router, profiles.router, plan.router, tax.router, chat.router):
    app.include_router(r, prefix="/api")


@app.get("/")
def root() -> dict:
    return {"service": settings.app_name, "docs": "/docs", "health": "/api/health"}
