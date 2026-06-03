"""CRUD for retirement profiles."""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/profiles", tags=["profiles"])

# Fields stored as JSON text in the DB but exposed as lists in the API.
_JSON_LIST_FIELDS = ("health_conditions", "hobbies", "relationship_focus")


def _to_model_kwargs(data: schemas.ProfileCreate) -> dict:
    payload = data.model_dump()
    for f in _JSON_LIST_FIELDS:
        payload[f] = json.dumps(payload.get(f) or [])
    return payload


def _to_read(profile: models.UserProfile) -> schemas.ProfileRead:
    base = {c.name: getattr(profile, c.name) for c in profile.__table__.columns}
    for f in _JSON_LIST_FIELDS:
        raw = base.get(f)
        base[f] = json.loads(raw) if raw else []
    return schemas.ProfileRead.model_validate(base)


@router.post("", response_model=schemas.ProfileRead, status_code=201)
def create_profile(data: schemas.ProfileCreate, db: Session = Depends(get_db)):
    profile = models.UserProfile(**_to_model_kwargs(data))
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return _to_read(profile)


@router.get("/{profile_id}", response_model=schemas.ProfileRead)
def get_profile(profile_id: str, db: Session = Depends(get_db)):
    profile = db.get(models.UserProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")
    return _to_read(profile)


@router.put("/{profile_id}", response_model=schemas.ProfileRead)
def update_profile(profile_id: str, data: schemas.ProfileCreate, db: Session = Depends(get_db)):
    profile = db.get(models.UserProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")
    for key, value in _to_model_kwargs(data).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return _to_read(profile)


@router.delete("/{profile_id}", status_code=204)
def delete_profile(profile_id: str, db: Session = Depends(get_db)):
    profile = db.get(models.UserProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")
    db.delete(profile)
    db.commit()
