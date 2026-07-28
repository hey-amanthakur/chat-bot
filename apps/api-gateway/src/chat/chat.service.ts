import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterService } from '../ai/services/openrouter.service';
import { RagService } from '../ai/services/rag.service';
import { LeadDetectorService } from '../ai/services/lead-detector.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly openrouter: OpenRouterService,
    private readonly rag: RagService,
    private readonly leadDetector: LeadDetectorService,
  ) {}

  async processMessage(clientId: string, message: string, sessionId: string) {
    try {
      const kb = await this.rag.getKnowledgeBase(clientId);

      const leadDetection = await this.leadDetector.detect(message);

      if (leadDetection.detectLead) {
        return {
          response:
            "I'd be happy to help connect you with our team! Could you please provide your name and phone number or email? We'll get back to you shortly.",
          lead_captured: true,
          session_id: sessionId,
        };
      }

      const response = await this.openrouter.chatCompletion(message, clientId, kb);

      return {
        response,
        lead_captured: false,
        session_id: sessionId,
      };
    } catch (error) {
      this.logger.error(`Chat processing error: ${error?.message || error}`);
      return {
        response: "I'm having trouble right now. Please try again.",
        lead_captured: false,
        session_id: sessionId,
      };
    }
  }
}
