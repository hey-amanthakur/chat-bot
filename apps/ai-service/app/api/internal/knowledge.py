from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class KnowledgeBase(BaseModel):
    client_id: str
    business_info: dict
    services: list
    faqs: list
    policies: list
    hours: list


@router.get("/knowledge-base/{client_id}")
async def get_knowledge_base(client_id: str):
    # TODO: Load from JSON files in data/clients/{client_id}/
    return {
        "client_id": client_id,
        "business_info": {},
        "services": [],
        "faqs": [],
        "policies": [],
        "hours": [],
    }
