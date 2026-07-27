from pydantic import BaseModel, Field
from typing import Optional
import uuid


class ChatMessage(BaseModel):
    client_id: str = Field(..., max_length=36)
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = Field(None, max_length=100)


class ChatResponse(BaseModel):
    response: str
    lead_captured: Optional[bool] = False
    session_id: str


class LeadDetection(BaseModel):
    detect_lead: bool
    confidence: float
    extracted_info: Optional[dict] = None
