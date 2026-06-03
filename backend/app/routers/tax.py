"""Tax optimizer — old vs new regime comparison."""
from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter

from .. import schemas
from ..core.tax import TaxInputs, compare_regimes

router = APIRouter(prefix="/tax", tags=["tax"])


@router.post("/compare", response_model=schemas.RegimeComparisonOut)
def compare(inp: schemas.TaxInputSchema):
    result = compare_regimes(TaxInputs(**inp.model_dump()))
    return schemas.RegimeComparisonOut.model_validate(asdict(result))
