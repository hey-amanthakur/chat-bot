import json
from pathlib import Path


class RAGService:
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent.parent.parent.parent / "data" / "clients"

    async def get_knowledge_base(self, client_id: str) -> dict:
        kb_path = self.data_dir / client_id
        if not kb_path.exists():
            return {
                "name": "Business",
                "tone": "friendly",
                "greeting": "Hi! How can I help you today?",
                "business_info": {},
                "services": [],
                "faqs": [],
                "policies": [],
                "hours": [],
            }

        config_file = kb_path / "config.json"
        if config_file.exists():
            with open(config_file) as f:
                return json.load(f)

        return {
            "name": "Business",
            "tone": "friendly",
            "greeting": "Hi! How can I help you today?",
            "business_info": {},
            "services": [],
            "faqs": [],
            "policies": [],
            "hours": [],
        }

    def retrieve_context(self, kb: dict, query: str) -> str:
        # For MVP: always return the full KB as context.
        # The LLM system prompt in OpenRouter handles scoping.
        # A proper RAG with vector search would filter here.
        context_parts = []

        if kb.get("services"):
            services = "\n".join(
                f"- {s['name']}: {s.get('price', 'N/A')} - {s.get('description', '')}"
                for s in kb["services"]
            )
            context_parts.append(f"SERVICES:\n{services}")

        if kb.get("faqs"):
            faqs = "\n".join(
                f"Q: {f['question']}\nA: {f['answer']}" for f in kb["faqs"]
            )
            context_parts.append(f"FAQS:\n{faqs}")

        if kb.get("hours"):
            hours = "\n".join(
                f"- {h['day']}: {h['open']} - {h['close']}" for h in kb["hours"]
            )
            context_parts.append(f"HOURS:\n{hours}")

        if kb.get("policies"):
            policies = "\n".join(f"- {p}" for p in kb["policies"])
            context_parts.append(f"POLICIES:\n{policies}")

        return "\n\n".join(context_parts) if context_parts else "No business information available."
