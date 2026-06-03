"""Database models. Mirrors the original Prisma UserProfile schema."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


def _cuid() -> str:
    return uuid.uuid4().hex


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_cuid)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)

    # Step 1 — Personal
    full_name: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    company_name: Mapped[str | None] = mapped_column(String, nullable=True)
    age: Mapped[int] = mapped_column(Integer)
    gender: Mapped[str] = mapped_column(String)
    marital_status: Mapped[str] = mapped_column(String)
    spouse_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dependents: Mapped[int] = mapped_column(Integer, default=0)
    city_tier: Mapped[str] = mapped_column(String)  # metro | tier2 | tier3

    # Step 2 — Financial
    corpus: Mapped[float] = mapped_column(Float)
    pension_monthly: Mapped[float] = mapped_column(Float, default=0)
    rental_monthly: Mapped[float] = mapped_column(Float, default=0)
    dividend_monthly: Mapped[float] = mapped_column(Float, default=0)
    eps_monthly: Mapped[float] = mapped_column(Float, default=0)
    nps_lump_sum: Mapped[float] = mapped_column(Float, default=0)
    nps_subscriber_self: Mapped[bool] = mapped_column(Boolean, default=True)
    funds_breakdown: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    asset_real_estate: Mapped[float] = mapped_column(Float, default=0)
    asset_gold: Mapped[float] = mapped_column(Float, default=0)
    asset_equity: Mapped[float] = mapped_column(Float, default=0)
    asset_fd: Mapped[float] = mapped_column(Float, default=0)
    liability_total: Mapped[float] = mapped_column(Float, default=0)
    emi_monthly: Mapped[float] = mapped_column(Float, default=0)
    has_health_insurance: Mapped[bool] = mapped_column(Boolean, default=False)
    health_cover: Mapped[float] = mapped_column(Float, default=0)

    # Step 3 — Income need
    desired_monthly_income: Mapped[float] = mapped_column(Float)
    expense_housing: Mapped[float] = mapped_column(Float, default=0)
    expense_food: Mapped[float] = mapped_column(Float, default=0)
    expense_medical: Mapped[float] = mapped_column(Float, default=0)
    expense_lifestyle: Mapped[float] = mapped_column(Float, default=0)
    expense_travel: Mapped[float] = mapped_column(Float, default=0)
    expense_other: Mapped[float] = mapped_column(Float, default=0)
    inflation_rate: Mapped[float] = mapped_column(Float, default=6)

    # Step 4 — Risk & goals
    risk_appetite: Mapped[str] = mapped_column(String)  # conservative | moderate | balanced
    planning_horizon: Mapped[int] = mapped_column(Integer, default=25)
    legacy_amount: Mapped[float] = mapped_column(Float, default=0)
    bucket_list_goals: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON

    # Step 5 — Health & lifestyle
    health_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    hobbies: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    social_engagement: Mapped[int] = mapped_column(Integer, default=5)
    relationship_focus: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON

    # Cached generated plan
    generated_plan: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
