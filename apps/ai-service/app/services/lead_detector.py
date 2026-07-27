from app.models.schemas import LeadDetection


class LeadDetector:
    LEAD_KEYWORDS = [
        "contact",
        "call me",
        "phone",
        "email",
        "appointment",
        "book",
        "schedule",
        "help me",
        "speak to someone",
        "talk to a person",
        "representative",
        "agent",
    ]

    async def detect(self, message: str, context: str = "") -> LeadDetection:
        message_lower = message.lower()

        keyword_matches = sum(1 for keyword in self.LEAD_KEYWORDS if keyword in message_lower)
        confidence = min(keyword_matches * 0.2, 1.0)

        if confidence >= 0.4:
            return LeadDetection(
                detect_lead=True,
                confidence=confidence,
                extracted_info={"message": message},
            )

        return LeadDetection(
            detect_lead=False,
            confidence=confidence,
            extracted_info=None,
        )
