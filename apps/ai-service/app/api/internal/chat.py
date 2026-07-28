import uuid
import logging
from fastapi import APIRouter, Request
from app.models.schemas import ChatMessage, ChatResponse
from app.services.openrouter import OpenRouterService
from app.services.rag import RAGService
from app.services.lead_detector import LeadDetector

logger = logging.getLogger(__name__)

router = APIRouter()
openrouter = OpenRouterService()
rag = RAGService()
lead_detector = LeadDetector()


@router.post("/chat", response_model=ChatResponse)
async def process_chat(request: Request, message: ChatMessage):
    session_id = message.session_id or str(uuid.uuid4())

    try:
        kb = await rag.get_knowledge_base(message.client_id)

        lead_detection = await lead_detector.detect(message.message)

        if lead_detection.detect_lead:
            return ChatResponse(
                response="I'd be happy to help connect you with our team! Could you please provide your name and phone number or email? We'll get back to you shortly.",
                lead_captured=True,
                session_id=session_id,
            )

        response = await openrouter.chat_completion(
            message=message.message,
            client_id=message.client_id,
            kb=kb,
        )

        return ChatResponse(
            response=response,
            lead_captured=False,
            session_id=session_id,
        )
    except Exception as e:
        logger.exception("Chat processing error")
        return ChatResponse(
            response="I'm having trouble right now. Please try again.",
            lead_captured=False,
            session_id=session_id,
        )
