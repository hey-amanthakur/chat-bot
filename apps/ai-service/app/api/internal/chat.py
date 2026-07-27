from fastapi import APIRouter, Request
from app.models.schemas import ChatMessage, ChatResponse
from app.services.openrouter import OpenRouterService
from app.services.rag import RAGService
from app.services.lead_detector import LeadDetector

router = APIRouter()
openrouter = OpenRouterService()
rag = RAGService()
lead_detector = LeadDetector()


@router.post("/chat", response_model=ChatResponse)
async def process_chat(request: Request, message: ChatMessage):
    kb = await rag.get_knowledge_base(message.client_id)
    context = rag.retrieve_context(kb, message.message)

    lead_detection = await lead_detector.detect(message.message, context)

    if lead_detection.detect_lead:
        return ChatResponse(
            response="I'd be happy to help connect you with our team. Could you please provide your name and contact information?",
            lead_captured=True,
            session_id=message.session_id or str(uuid.uuid4()),
        )

    response = await openrouter.chat_completion(
        message=message.message,
        context=context,
        client_id=message.client_id,
    )

    return ChatResponse(
        response=response,
        lead_captured=False,
        session_id=message.session_id or str(uuid.uuid4()),
    )
