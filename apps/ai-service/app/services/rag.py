import json
import os
from pathlib import Path
from typing import List


class RAGService:
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent.parent.parent / "data" / "clients"

    async def get_knowledge_base(self, client_id: str) -> dict:
        kb_path = self.data_dir / client_id
        if not kb_path.exists():
            return {"business_info": {}, "services": [], "faqs": [], "policies": [], "hours": []}

        kb = {}
        config_file = kb_path / "config.json"
        if config_file.exists():
            with open(config_file) as f:
                kb = json.load(f)

        knowledge_file = kb_path / "knowledge.md"
        if knowledge_file.exists():
            with open(knowledge_file) as f:
                kb["raw_knowledge"] = f.read()

        return kb

    def retrieve_context(self, kb: dict, query: str) -> str:
        # Simple keyword-based retrieval for MVP
        # TODO: Implement proper vector similarity search
        context_parts = []

        if "raw_knowledge" in kb:
            context_parts.append(kb["raw_knowledge"])

        for faq in kb.get("faqs", []):
            if any(word.lower() in str(faq).lower() for word in query.split()):
                context_parts.append(f"Q: {faq.get('question', '')}\nA: {faq.get('answer', '')}")

        return "\n\n".join(context_parts) if context_parts else "No relevant information found."
