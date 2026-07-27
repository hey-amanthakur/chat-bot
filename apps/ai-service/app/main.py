from fastapi import FastAPI
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api.internal import chat, knowledge, leads

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="AI Chatbot Service",
    description="Internal AI service for chat processing",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(chat.router, prefix="/internal", tags=["chat"])
app.include_router(knowledge.router, prefix="/internal", tags=["knowledge"])
app.include_router(leads.router, prefix="/internal", tags=["leads"])


@app.get("/internal/health")
async def health_check():
    return {"status": "ok", "service": "ai-service"}
