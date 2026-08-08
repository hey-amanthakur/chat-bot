import { OpenRouterService } from '../ai/services/openrouter.service';
import { RagService } from '../ai/services/rag.service';
import { LeadDetectorService } from '../ai/services/lead-detector.service';

export interface ChatServiceDeps {
  openrouter: OpenRouterService;
  rag: RagService;
  leadDetector: LeadDetectorService;
}

export interface ChatResult {
  response: string;
  lead_captured: boolean;
  session_id: string;
}

export class ChatService {
  private readonly openrouter: OpenRouterService;
  private readonly rag: RagService;
  private readonly leadDetector: LeadDetectorService;

  constructor(deps: ChatServiceDeps) {
    this.openrouter = deps.openrouter;
    this.rag = deps.rag;
    this.leadDetector = deps.leadDetector;
  }

  async processMessage(clientId: string, message: string, sessionId: string): Promise<ChatResult> {
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
      console.error(
        `Chat processing error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        response: "I'm having trouble right now. Please try again.",
        lead_captured: false,
        session_id: sessionId,
      };
    }
  }
}
