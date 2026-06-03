"""AI advisor chat — streams a Gemini response grounded in the user's plan."""
from __future__ import annotations

from collections.abc import Iterator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import models, schemas
from ..core.advisor import (
    FROZEN_SYSTEM_PROMPT,
    build_profile_context,
    detect_language_instruction,
    get_gemini_model,
)
from ..core.calculations import generate_plan
from ..database import get_db
from .plan import profile_to_inputs

router = APIRouter(prefix="/chat", tags=["chat"])


def _build_system_instruction(db: Session, profile_id: str | None, last_user_msg: str) -> str:
    parts = [FROZEN_SYSTEM_PROMPT]
    if profile_id:
        profile = db.get(models.UserProfile, profile_id)
        if profile:
            plan = generate_plan(profile_to_inputs(profile))
            parts.append(build_profile_context(plan, profile.full_name, profile.age))
    parts.append(
        "# 🔒 LANGUAGE FOR THIS REPLY (MACHINE-DETECTED, NON-NEGOTIABLE)\n"
        + detect_language_instruction(last_user_msg)
    )
    return "\n\n---\n\n".join(parts)


@router.post("")
def chat(req: schemas.ChatRequest, db: Session = Depends(get_db)):
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages required")

    try:
        genai = get_gemini_model()
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    from ..config import get_settings

    last_user = next((m.content for m in reversed(req.messages) if m.role == "user"), "")
    system_instruction = _build_system_instruction(db, req.profile_id, last_user)

    model = genai.GenerativeModel(
        model_name=get_settings().gemini_model,
        system_instruction=system_instruction,
    )
    history = [
        {"role": "model" if m.role == "assistant" else "user", "parts": [m.content]}
        for m in req.messages
    ]

    def stream() -> Iterator[str]:
        try:
            response = model.generate_content(
                history,
                stream=True,
                generation_config={"temperature": 0.7, "max_output_tokens": 2048},
            )
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as exc:  # pragma: no cover - surfaced inline to the client
            yield f"\n\n[Error: {exc}]"

    return StreamingResponse(stream(), media_type="text/plain; charset=utf-8")
