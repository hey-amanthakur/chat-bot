import httpx
import logging
from app.core.config import get_settings

logger = logging.getLogger(__name__)


class OpenRouterService:
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.OPENROUTER_BASE_URL
        self.api_key = self.settings.OPENROUTER_API_KEY

    def _build_system_prompt(self, kb: dict) -> str:
        business_name = kb.get("name", "this business")
        tone = kb.get("tone", "friendly")
        greeting = kb.get("greeting", f"Hi! Welcome to {business_name}. How can I help you today?")

        services_text = ""
        for s in kb.get("services", []):
            services_text += f"- {s['name']}: {s['price']} ({s['description']})\n"

        hours_text = ""
        for h in kb.get("hours", []):
            hours_text += f"- {h['day']}: {h['open']} - {h['close']}\n"

        faqs_text = ""
        for faq in kb.get("faqs", []):
            faqs_text += f"Q: {faq['question']}\nA: {faq['answer']}\n\n"

        policies_text = "\n".join(f"- {p}" for p in kb.get("policies", []))

        return f"""You are a helpful customer service assistant for {business_name}.

IMPORTANT RULES:
1. ONLY answer questions using the information provided below. Do NOT make up information.
2. If you don't know the answer or the information isn't provided, say "I'm not sure about that, but I'd be happy to connect you with our team who can help."
3. Keep responses concise and conversational.
4. Be {tone} in tone.
5. If the customer seems to need help beyond FAQs (booking, pricing, emergencies), encourage them to contact the business directly.
6. Never share internal business details, pricing strategies, or competitor comparisons.

GREETING: {greeting}

BUSINESS INFORMATION:
Name: {business_name}
Address: {kb.get('business_info', {}).get('address', 'N/A')}
Phone: {kb.get('business_info', {}).get('phone', 'N/A')}
Email: {kb.get('business_info', {}).get('email', 'N/A')}

SERVICES:
{services_text}

HOURS:
{hours_text}

FAQS:
{faqs_text}

POLICIES:
{policies_text}

When the customer asks a question, provide a helpful answer based on this information. If you cannot answer, offer to connect them with the team."""

    async def chat_completion(self, message: str, client_id: str, kb: dict = None) -> str:
        system_prompt = self._build_system_prompt(kb or {})

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://chat-bot.example.com",
                        "X-Title": "Business Chatbot",
                    },
                    json={
                        "model": kb.get("model", "inclusionai/ling-3.0-flash:free"),
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": message},
                        ],
                        "max_tokens": kb.get("max_tokens", 500),
                        "temperature": 0.7,
                    },
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as e:
                logger.error(f"OpenRouter HTTP error: {e.response.status_code} - {e.response.text}")
                return "I'm experiencing a temporary issue. Please try again in a moment."
            except httpx.HTTPError as e:
                logger.error(f"OpenRouter connection error: {e}")
                return "I'm having trouble connecting right now. Please try again later."
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                return "Something went wrong. Please try again."
