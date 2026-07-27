import httpx
from app.core.config import get_settings


class OpenRouterService:
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.OPENROUTER_BASE_URL
        self.api_key = self.settings.OPENROUTER_API_KEY

    async def chat_completion(self, message: str, context: str, client_id: str) -> str:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "meta-llama/llama-3.1-8b-instruct:free",
                        "messages": [
                            {"role": "system", "content": f"Context: {context}"},
                            {"role": "user", "content": message},
                        ],
                        "max_tokens": 500,
                        "temperature": 0.7,
                    },
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
            except httpx.HTTPError as e:
                return f"I'm having trouble connecting. Please try again later."
