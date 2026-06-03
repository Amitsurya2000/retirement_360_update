"""Retirement plan generation — the bucket strategy."""
from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .. import models, schemas
from ..core.calculations import GeneratedPlan, PlanInputs, generate_plan
from ..database import get_db

router = APIRouter(prefix="/plan", tags=["plan"])


def profile_to_inputs(p: models.UserProfile) -> PlanInputs:
    return PlanInputs(
        age=p.age,
        corpus=p.corpus,
        desired_monthly_income=p.desired_monthly_income,
        other_monthly_income=p.pension_monthly + p.rental_monthly + p.dividend_monthly,
        inflation_rate=p.inflation_rate,
        planning_horizon=p.planning_horizon,
        risk_appetite=p.risk_appetite,  # type: ignore[arg-type]
        legacy_amount=p.legacy_amount,
    )


def _plan_to_out(plan: GeneratedPlan) -> schemas.PlanOut:
    return schemas.PlanOut.model_validate(asdict(plan))


class PlanRequest(BaseModel):
    age: int = Field(ge=40, le=95)
    corpus: float = Field(ge=100_000)
    desired_monthly_income: float = Field(ge=1000)
    other_monthly_income: float = 0
    inflation_rate: float = Field(default=6, ge=0, le=20)
    planning_horizon: int = Field(default=25, ge=10, le=40)
    risk_appetite: schemas.RiskAppetite = "moderate"
    legacy_amount: float = 0


@router.post("", response_model=schemas.PlanOut)
def compute_plan(req: PlanRequest):
    """Generate a plan from raw inputs (no saved profile needed)."""
    inputs = PlanInputs(
        age=req.age, corpus=req.corpus, desired_monthly_income=req.desired_monthly_income,
        other_monthly_income=req.other_monthly_income, inflation_rate=req.inflation_rate,
        planning_horizon=req.planning_horizon, risk_appetite=req.risk_appetite,
        legacy_amount=req.legacy_amount,
    )
    return _plan_to_out(generate_plan(inputs))


@router.get("/{profile_id}", response_model=schemas.PlanOut)
def plan_for_profile(profile_id: str, db: Session = Depends(get_db)):
    """Generate a plan from a saved profile."""
    profile = db.get(models.UserProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")
    return _plan_to_out(generate_plan(profile_to_inputs(profile)))
