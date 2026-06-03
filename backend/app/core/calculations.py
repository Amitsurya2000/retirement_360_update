"""Core financial calculations for the bucket strategy.

Faithful Python port of the original TypeScript engine (src/lib/calculations.ts
+ src/lib/tax.ts). All amounts in INR. Returns are annual percentages (8 = 8%).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional

RiskAppetite = Literal["conservative", "moderate", "balanced"]


@dataclass
class PlanInputs:
    age: int
    corpus: float
    desired_monthly_income: float
    other_monthly_income: float  # pension + rental + dividends
    inflation_rate: float
    planning_horizon: int
    risk_appetite: RiskAppetite
    legacy_amount: float = 0.0


@dataclass
class InstrumentAllocation:
    name: str
    amount: float
    expected_return: float  # annual %
    notes: Optional[str] = None


@dataclass
class Bucket:
    id: int
    name: str
    description: str
    years_covered: str
    target_percent: float
    amount: float
    blended_return: float
    instruments: list[InstrumentAllocation]


@dataclass
class YearlyProjection:
    year: int
    age: int
    gross_monthly_income: float
    net_monthly_income: float
    inflation_adjusted: float
    expenses_required: float
    corpus_end_of_year: float
    withdrawal_this_year: float


@dataclass
class PlanSummary:
    monthly_income_year1: float
    monthly_income_year10: float
    inflation_adjusted_year10: float
    total_lifetime_income: float
    estimated_tax_paid: float


@dataclass
class GeneratedPlan:
    buckets: list[Bucket]
    total_corpus: float
    blended_return: float
    projections: list[YearlyProjection]
    shortfall_year: Optional[int]
    legacy_at_end: float
    summary: PlanSummary


# Risk-based bucket allocation percentages.
ALLOCATION_BY_RISK: dict[str, dict[str, float]] = {
    "conservative": {"b1": 0.25, "b2": 0.50, "b3": 0.25},
    "moderate": {"b1": 0.20, "b2": 0.45, "b3": 0.35},
    "balanced": {"b1": 0.15, "b2": 0.40, "b3": 0.45},
}


def _blended(instruments: list[InstrumentAllocation]) -> float:
    total = sum(i.amount for i in instruments)
    if total == 0:
        return 0.0
    return sum((i.amount / total) * i.expected_return for i in instruments)


def generate_buckets(inputs: PlanInputs) -> list[Bucket]:
    alloc = ALLOCATION_BY_RISK[inputs.risk_appetite]
    corpus, age = inputs.corpus, inputs.age

    # ---- BUCKET 1: Safety (0-3 years) ----
    b1_amount = corpus * alloc["b1"]
    scss_eligible = age >= 60
    scss_cap = 3_000_000  # ₹30L
    scss_alloc = min(b1_amount * 0.55, scss_cap) if scss_eligible else 0.0
    pomis_alloc = min((b1_amount - scss_alloc) * 0.30, 900_000)  # POMIS cap ₹9L single
    fd_ladder_alloc = (b1_amount - scss_alloc - pomis_alloc) * 0.70
    liquid_fund_alloc = b1_amount - scss_alloc - pomis_alloc - fd_ladder_alloc

    bucket1: list[InstrumentAllocation] = []
    if scss_alloc > 0:
        bucket1.append(InstrumentAllocation(
            "Senior Citizen Savings Scheme (SCSS)", scss_alloc, 8.2,
            "Quarterly payout. 5-year lock-in (extendable). Govt-backed."))
    if pomis_alloc > 0:
        bucket1.append(InstrumentAllocation(
            "Post Office Monthly Income Scheme (POMIS)", pomis_alloc, 7.4,
            "Monthly payout. 5-year tenure. Cap ₹9L single / ₹15L joint."))
    bucket1.append(InstrumentAllocation(
        "Bank FD Ladder (1y / 2y / 3y)", fd_ladder_alloc, 7.25,
        "Split across 3 maturities to reinvest at prevailing rates each year."))
    bucket1.append(InstrumentAllocation(
        "Liquid Mutual Fund (emergency reserve)", liquid_fund_alloc, 6.5,
        "Instant withdrawal for medical or unexpected needs."))

    # ---- BUCKET 2: Income (3-10 years) ----
    b2_amount = corpus * alloc["b2"]
    pmvvy_alloc = min(b2_amount * 0.20, 1_500_000) if scss_eligible else 0.0
    debt_mf_alloc = b2_amount * 0.45
    corp_fd_alloc = b2_amount * 0.25
    tax_free_bond_alloc = b2_amount - pmvvy_alloc - debt_mf_alloc - corp_fd_alloc

    bucket2: list[InstrumentAllocation] = []
    if pmvvy_alloc > 0:
        bucket2.append(InstrumentAllocation(
            "PMVVY (Pradhan Mantri Vaya Vandana Yojana)", pmvvy_alloc, 7.4,
            "10-year guaranteed pension. Subject to availability — verify with LIC."))
    bucket2.append(InstrumentAllocation(
        "Debt Mutual Funds (SWP)", debt_mf_alloc, 7.5,
        "Systematic Withdrawal Plan for tax-efficient monthly income."))
    bucket2.append(InstrumentAllocation(
        "AAA-rated Corporate FDs", corp_fd_alloc, 8.0,
        "Bajaj Finance, HDFC, etc. Higher yield than bank FDs."))
    if tax_free_bond_alloc > 0:
        bucket2.append(InstrumentAllocation(
            "Tax-free Bonds (secondary market)", tax_free_bond_alloc, 6.0,
            "Tax-free interest — effective yield ~8.5% for 30% slab."))

    # ---- BUCKET 3: Growth (10-25 years) ----
    b3_amount = corpus * alloc["b3"]
    bucket3 = [
        InstrumentAllocation("Corporate & Govt Bonds", b3_amount * 0.30, 7.5,
                             "Assured debt returns from high-grade corporate and government bonds."),
        InstrumentAllocation("Gold & Silver", b3_amount * 0.10, 8.0,
                             "Hedge against equity — cushions the portfolio when markets fall."),
        InstrumentAllocation("REITs (Embassy, Mindspace, Brookfield)", b3_amount * 0.15, 8.5,
                             "Predictable quarterly income — real-estate-like returns without owning property."),
        InstrumentAllocation("Arbitrage Funds", b3_amount * 0.10, 7.0,
                             "Low-risk, tax-efficient parking for any opportunistic upside."),
        InstrumentAllocation("Indian Equity", b3_amount * 0.25, 12.0,
                             "Long-term inflation-beating growth via Indian equity funds. Withdraw via SWP later."),
        InstrumentAllocation("Foreign Equity", b3_amount * 0.10, 12.0,
                             "Global diversification — exposure beyond the Indian market."),
    ]

    return [
        Bucket(1, "Safety Bucket",
               "Capital protection for the next 3 years of expenses. Guaranteed-return instruments only.",
               "Years 1–3", alloc["b1"] * 100, b1_amount, _blended(bucket1), bucket1),
        Bucket(2, "Income Bucket",
               "Reliable income for years 3–10. Mix of govt-backed schemes and high-grade debt.",
               "Years 3–10", alloc["b2"] * 100, b2_amount, _blended(bucket2), bucket2),
        Bucket(3, "Growth Bucket",
               "Beats inflation across years 10–25. Equity-tilted but moderated for retirees.",
               "Years 10–25", alloc["b3"] * 100, b3_amount, _blended(bucket3), bucket3),
    ]


def _estimate_effective_tax_rate(annual_income: float, age: int) -> float:
    exemption = 500_000 if age >= 80 else 300_000 if age >= 60 else 250_000
    taxable = max(0.0, annual_income - exemption)
    tax = 0.0
    if age >= 60:
        if taxable > 0:
            tax += min(taxable, 200_000) * 0.05
        if taxable > 200_000:
            tax += min(taxable - 200_000, 500_000) * 0.20
        if taxable > 700_000:
            tax += (taxable - 700_000) * 0.30
    else:
        if taxable > 0:
            tax += min(taxable, 250_000) * 0.05
        if taxable > 250_000:
            tax += min(taxable - 250_000, 500_000) * 0.20
        if taxable > 750_000:
            tax += (taxable - 750_000) * 0.30
    if age >= 60 and annual_income < 800_000:
        tax = max(0.0, tax - 10_000)
    return tax / annual_income if annual_income > 0 else 0.0


def project_years(inputs: PlanInputs, buckets: list[Bucket]) -> list[YearlyProjection]:
    corpus = inputs.corpus
    projections: list[YearlyProjection] = []
    blended = sum(b.blended_return * (b.amount / corpus) for b in buckets) if corpus else 0.0

    remaining = corpus
    monthly_need = max(0.0, inputs.desired_monthly_income - inputs.other_monthly_income)

    for year_index in range(inputs.planning_horizon):
        year = year_index + 1
        current_age = inputs.age + year_index
        inflation_factor = (1 + inputs.inflation_rate / 100) ** year_index
        required_monthly = monthly_need * inflation_factor
        required_annual = required_monthly * 12

        grown = remaining * (1 + blended / 100)
        withdrawal = min(required_annual, max(0.0, grown))
        remaining = max(0.0, grown - withdrawal)

        gross_annual = withdrawal + inputs.other_monthly_income * 12
        tax_rate = _estimate_effective_tax_rate(gross_annual, current_age)
        net_annual = gross_annual * (1 - tax_rate)

        projections.append(YearlyProjection(
            year=year, age=current_age,
            gross_monthly_income=gross_annual / 12,
            net_monthly_income=net_annual / 12,
            inflation_adjusted=(net_annual / 12) / inflation_factor,
            expenses_required=required_monthly,
            corpus_end_of_year=remaining,
            withdrawal_this_year=withdrawal,
        ))
    return projections


def generate_plan(inputs: PlanInputs) -> GeneratedPlan:
    buckets = generate_buckets(inputs)
    projections = project_years(inputs, buckets)
    blended = sum(b.blended_return * (b.amount / inputs.corpus) for b in buckets) if inputs.corpus else 0.0

    shortfall_year = next(
        (p.year for p in projections
         if p.corpus_end_of_year == 0 and p.withdrawal_this_year < p.expenses_required * 12),
        None,
    )
    legacy_at_end = projections[-1].corpus_end_of_year if projections else 0.0
    total_lifetime = sum(p.net_monthly_income * 12 for p in projections)
    total_gross = sum(p.gross_monthly_income * 12 for p in projections)

    return GeneratedPlan(
        buckets=buckets,
        total_corpus=inputs.corpus,
        blended_return=blended,
        projections=projections,
        shortfall_year=shortfall_year,
        legacy_at_end=legacy_at_end,
        summary=PlanSummary(
            monthly_income_year1=projections[0].net_monthly_income if projections else 0.0,
            monthly_income_year10=projections[9].net_monthly_income if len(projections) > 9 else 0.0,
            inflation_adjusted_year10=projections[9].inflation_adjusted if len(projections) > 9 else 0.0,
            total_lifetime_income=total_lifetime,
            estimated_tax_paid=total_gross - total_lifetime,
        ),
    )
