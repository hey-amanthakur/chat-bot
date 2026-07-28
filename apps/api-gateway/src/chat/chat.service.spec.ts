import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { OpenRouterService } from '../ai/services/openrouter.service';
import { RagService } from '../ai/services/rag.service';
import { LeadDetectorService } from '../ai/services/lead-detector.service';

describe('ChatService', () => {
  let service: ChatService;
  let mockOpenRouter: jest.Mocked<OpenRouterService>;
  let mockRag: jest.Mocked<RagService>;
  let mockLeadDetector: jest.Mocked<LeadDetectorService>;

  beforeEach(async () => {
    mockOpenRouter = {
      chatCompletion: jest.fn(),
      buildSystemPrompt: jest.fn(),
    } as any;

    mockRag = {
      getKnowledgeBase: jest.fn(),
      retrieveContext: jest.fn(),
      setClients: jest.fn(),
    } as any;

    mockLeadDetector = {
      detect: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: OpenRouterService, useValue: mockOpenRouter },
        { provide: RagService, useValue: mockRag },
        { provide: LeadDetectorService, useValue: mockLeadDetector },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processMessage', () => {
    it('should return AI response for normal message', async () => {
      mockRag.getKnowledgeBase.mockResolvedValue({ name: 'Test' });
      mockLeadDetector.detect.mockResolvedValue({
        detectLead: false,
        confidence: 0,
        extractedInfo: null,
      });
      mockOpenRouter.chatCompletion.mockResolvedValue('Hello! How can I help?');

      const result = await service.processMessage('client1', 'Hi there', 'session1');

      expect(result.response).toBe('Hello! How can I help?');
      expect(result.lead_captured).toBe(false);
      expect(result.session_id).toBe('session1');
    });

    it('should capture lead when lead detected', async () => {
      mockRag.getKnowledgeBase.mockResolvedValue({ name: 'Test' });
      mockLeadDetector.detect.mockResolvedValue({
        detectLead: true,
        confidence: 0.45,
        extractedInfo: { message: 'book appointment' },
      });

      const result = await service.processMessage('client1', 'book appointment', 'session1');

      expect(result.lead_captured).toBe(true);
      expect(result.response).toContain('connect you with our team');
      expect(mockOpenRouter.chatCompletion).not.toHaveBeenCalled();
    });

    it('should use correct session ID', async () => {
      mockRag.getKnowledgeBase.mockResolvedValue({});
      mockLeadDetector.detect.mockResolvedValue({
        detectLead: false,
        confidence: 0,
        extractedInfo: null,
      });
      mockOpenRouter.chatCompletion.mockResolvedValue('Hi');

      const result = await service.processMessage('c1', 'Hi', 'my-session-123');
      expect(result.session_id).toBe('my-session-123');
    });

    it('should handle errors gracefully', async () => {
      mockRag.getKnowledgeBase.mockRejectedValue(new Error('File not found'));

      const result = await service.processMessage('client1', 'Hi', 'session1');
      expect(result.response).toContain('trouble');
      expect(result.lead_captured).toBe(false);
      expect(result.session_id).toBe('session1');
    });

    it('should handle OpenRouter errors gracefully', async () => {
      mockRag.getKnowledgeBase.mockResolvedValue({ name: 'Test' });
      mockLeadDetector.detect.mockResolvedValue({
        detectLead: false,
        confidence: 0,
        extractedInfo: null,
      });
      mockOpenRouter.chatCompletion.mockRejectedValue(new Error('API down'));

      const result = await service.processMessage('client1', 'Hi', 'session1');
      expect(result.response).toContain('trouble');
    });

    it('should load knowledge base for the correct client', async () => {
      mockRag.getKnowledgeBase.mockResolvedValue({ name: 'Salon' });
      mockLeadDetector.detect.mockResolvedValue({
        detectLead: false,
        confidence: 0,
        extractedInfo: null,
      });
      mockOpenRouter.chatCompletion.mockResolvedValue('Hi');

      await service.processMessage('my-salon', 'Hi', 's1');
      expect(mockRag.getKnowledgeBase).toHaveBeenCalledWith('my-salon');
    });
  });
});
