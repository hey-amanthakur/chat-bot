from fastapi import APIRouter
from app.models.schemas import LeadDetection

router = APIRouter()


@router.post("/leads/detect")
async def detect_lead(message: str, context: str = ""):
    # TODO: Implement lead detection logic
    return LeadDetection(
        detect_lead=False,
        confidence=0.0,
        extracted_info=None,
    )
