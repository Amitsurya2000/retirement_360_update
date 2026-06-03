"""Indian senior-citizen tax calculation. Python port of src/lib/tax.ts.

Old regime (with 80C/80D/80TTB deductions) and new regime. FY24-25 / FY25-26 ref.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

AgeBracket = Literal["regular", "senior", "super_senior"]
Regime = Literal["old", "new"]


def age_bracket(age: int) -> AgeBracket:
    if age >= 80:
        return "super_senior"
    if age >= 60:
        return "senior"
    return "regular"


@dataclass
class TaxInputs:
    age: int
    pension_annual: float = 0.0
    interest_annual: float = 0.0
    rental_annual: float = 0.0
    capital_gains_lt: float = 0.0
    capital_gains_st: float = 0.0
    dividends_annual: float = 0.0
    other_annual: float = 0.0
    section_80c: float = 0.0
    section_80ddb: float = 0.0
    section_80ttb: float = 0.0
    standard_deduction: float = 0.0


@dataclass
class TaxBreakdown:
    regime: Regime
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


def _old_regime_slabs(taxable: float, bracket: AgeBracket) -> float:
    exemption = 500_000 if bracket == "super_senior" else 300_000 if bracket == "senior" else 250_000
    remaining = max(0.0, taxable - exemption)
    tax = 0.0
    if bracket != "super_senior":
        band1 = min(remaining, 200_000)
        tax += band1 * 0.05
        remaining -= band1
    band2_limit = 1_000_000 - 500_000
    band2 = min(remaining, band2_limit)
    tax += band2 * 0.20
    remaining -= band2
    tax += remaining * 0.30
    return tax


def _new_regime_slabs(taxable: float) -> float:
    # 0-4L: 0, 4-8L: 5%, 8-12L: 10%, 12-16L: 15%, 16-20L: 20%, 20-24L: 25%, >24L: 30%
    bands = [
        (400_000, 0.0), (800_000, 0.05), (1_200_000, 0.10), (1_600_000, 0.15),
        (2_000_000, 0.20), (2_400_000, 0.25), (float("inf"), 0.30),
    ]
    tax = 0.0
    prev = 0.0
    for limit, rate in bands:
        if taxable <= prev:
            break
        slice_amt = min(taxable, limit) - prev
        tax += slice_amt * rate
        prev = limit
    return tax


def _rebate_87a(tax_on_slabs: float, total_income: float, regime: Regime) -> float:
    if regime == "old" and total_income <= 500_000:
        return min(tax_on_slabs, 12_500)
    if regime == "new" and total_income <= 1_200_000:
        return min(tax_on_slabs, 60_000)
    return 0.0


def calc_tax(inp: TaxInputs, regime: Regime) -> TaxBreakdown:
    bracket = age_bracket(inp.age)
    slab_income = (
        inp.pension_annual + inp.interest_annual + inp.rental_annual * 0.7
        + inp.dividends_annual + inp.other_annual
    )
    gross_income = slab_income + inp.capital_gains_lt + inp.capital_gains_st

    if regime == "old":
        total_deductions = (
            min(inp.section_80c, 150_000)
            + min(inp.section_80ddb, 100_000 if bracket != "regular" else 40_000)
            + min(inp.section_80ttb, 50_000 if bracket != "regular" else 0)
            + min(inp.standard_deduction, 50_000)
        )
    else:
        total_deductions = min(inp.standard_deduction, 75_000)

    taxable_slab = max(0.0, slab_income - total_deductions)
    tax_on_slabs = _old_regime_slabs(taxable_slab, bracket) if regime == "old" else _new_regime_slabs(taxable_slab)

    tax_on_ltcg = max(0.0, inp.capital_gains_lt - 125_000) * 0.125
    tax_on_stcg = inp.capital_gains_st * 0.20

    rebate = _rebate_87a(tax_on_slabs, taxable_slab, regime)
    before_cess = max(0.0, tax_on_slabs - rebate) + tax_on_ltcg + tax_on_stcg
    cess = before_cess * 0.04
    total_tax = before_cess + cess

    return TaxBreakdown(
        regime=regime, gross_income=gross_income, total_deductions=total_deductions,
        taxable_income=taxable_slab, tax_on_slabs=tax_on_slabs, tax_on_ltcg=tax_on_ltcg,
        tax_on_stcg=tax_on_stcg, rebate_87a=rebate, cess_and_surcharge=cess,
        total_tax=total_tax, effective_rate=total_tax / gross_income if gross_income > 0 else 0.0,
    )


@dataclass
class RegimeComparison:
    old: TaxBreakdown
    new: TaxBreakdown
    savings: float
    recommended: Regime


def compare_regimes(inp: TaxInputs) -> RegimeComparison:
    old_r = calc_tax(inp, "old")
    new_r = calc_tax(inp, "new")
    return RegimeComparison(
        old=old_r, new=new_r,
        savings=abs(old_r.total_tax - new_r.total_tax),
        recommended="old" if old_r.total_tax <= new_r.total_tax else "new",
    )
