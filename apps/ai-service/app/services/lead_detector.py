from app.models.schemas import LeadDetection


class LeadDetector:
    LEAD_KEYWORDS = [
        "contact",
        "call me",
        "phone number",
        "email me",
        "appointment",
        "book",
        "schedule",
        "speak to someone",
        "talk to a person",
        "representative",
        "agent",
        "human",
        "real person",
        "manager",
    ]

    LEAD_PATTERNS = [
        "my number is",
        "my email is",
        "you can reach me",
        "call me at",
        "email me at",
        "my name is",
    ]

    async def detect(self, message: str, context: str = "") -> LeadDetection:
        message_lower = message.lower()

        keyword_matches = sum(1 for keyword in self.LEAD_KEYWORDS if keyword in message_lower)
        pattern_matches = sum(1 for pattern in self.LEAD_PATTERNS if pattern in message_lower)

        confidence = min((keyword_matches * 0.15) + (pattern_matches * 0.3), 1.0)

        if confidence >= 0.3:
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
