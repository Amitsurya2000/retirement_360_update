"""Pydantic request/response schemas."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

RiskAppetite = Literal["conservative", "moderate", "balanced"]


# ─────────────────────────── Profile ───────────────────────────
class ProfileBase(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    age: int = Field(ge=40, le=95)
    gender: Literal["male", "female", "other"] = "male"
    marital_status: Literal["single", "married", "widowed", "divorced"] = "married"
    spouse_age: Optional[int] = None
    dependents: int = 0
    city_tier: Literal["metro", "tier2", "tier3"] = "metro"

    corpus: float = Field(ge=100_000)
    pension_monthly: float = 0
    rental_monthly: float = 0
    dividend_monthly: float = 0
    eps_monthly: float = 0
    nps_lump_sum: float = 0
    nps_subscriber_self: bool = True
    asset_real_estate: float = 0
    asset_gold: float = 0
    asset_equity: float = 0
    asset_fd: float = 0
    liability_total: float = 0
    emi_monthly: float = 0
    has_health_insurance: bool = False
    health_cover: float = 0

    desired_monthly_income: float = Field(ge=1000)
    expense_housing: float = 0
    expense_food: float = 0
    expense_medical: float = 0
    expense_lifestyle: float = 0
    expense_travel: float = 0
    expense_other: float = 0
    inflation_rate: float = Field(default=6, ge=0, le=20)

    risk_appetite: RiskAppetite = "moderate"
    planning_horizon: int = Field(default=25, ge=10, le=40)
    legacy_amount: float = 0

    health_conditions: list[str] = Field(default_factory=list)
    hobbies: list[str] = Field(default_factory=list)
    social_engagement: int = Field(default=5, ge=1, le=10)
    relationship_focus: list[str] = Field(default_factory=list)


class ProfileCreate(ProfileBase):
    pass


class ProfileRead(ProfileBase):
    model_config = ConfigDict(from_attributes=True)
    id: str


# ─────────────────────────── Plan ───────────────────────────
class InstrumentOut(BaseModel):
    name: str
    amount: float
    expected_return: float
    notes: Optional[str] = None


class BucketOut(BaseModel):
    id: int
    name: str
    description: str
    years_covered: str
    target_percent: float
    amount: float
    blended_return: float
    instruments: list[InstrumentOut]


class ProjectionOut(BaseModel):
    year: int
    age: int
    gross_monthly_income: float
    net_monthly_income: float
    inflation_adjusted: float
    expenses_required: float
    corpus_end_of_year: float
    withdrawal_this_year: float


class PlanSummaryOut(BaseModel):
    monthly_income_year1: float
    monthly_income_year10: float
    inflation_adjusted_year10: float
    total_lifetime_income: float
    estimated_tax_paid: float


class PlanOut(BaseModel):
    buckets: list[BucketOut]
    total_corpus: float
    blended_return: float
    projections: list[ProjectionOut]
    shortfall_year: Optional[int]
    legacy_at_end: float
    summary: PlanSummaryOut


# ─────────────────────────── Tax ───────────────────────────
class TaxInputSchema(BaseModel):
    age: int = Field(ge=18, le=120)
    pension_annual: float = 0
    interest_annual: float = 0
    rental_annual: float = 0
    capital_gains_lt: float = 0
    capital_gains_st: float = 0
    dividends_annual: float = 0
    other_annual: float = 0
    section_80c: float = 0
    section_80ddb: float = 0
    section_80ttb: float = 0
    standard_deduction: float = 0


class TaxBreakdownOut(BaseModel):
    regime: str
    gross_income: float
    total_deductions: float
    taxable_income: float
    tax_on_slabs: float
    tax_on_ltcg: float
    tax_on_stcg: float
    rebate_87a: float
    cess_and_surcharge: float
    total_tax: float
    effective_rate: float


class RegimeComparisonOut(BaseModel):
    old: TaxBreakdownOut
    new: TaxBreakdownOut
    savings: float
    recommended: str


# ─────────────────────────── Chat ───────────────────────────
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    profile_id: Optional[str] = None
    messages: list[ChatMessage]
