import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;
  let mockChatService: jest.Mocked<ChatService>;

  beforeEach(async () => {
    mockChatService = {
      processMessage: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: mockChatService }],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('chat', () => {
    it('should call ChatService.processMessage with correct params', async () => {
      mockChatService.processMessage.mockResolvedValue({
        response: 'Hi!',
        lead_captured: false,
        session_id: 'session1',
      });

      const result = await controller.chat(
        { clientId: 'client1', message: 'Hello' },
        { ip: '127.0.0.1' },
      );

      expect(mockChatService.processMessage).toHaveBeenCalledWith(
        'client1',
        'Hello',
        '127.0.0.1',
      );
      expect(result.response).toBe('Hi!');
    });

    it('should use provided sessionId over req.ip', async () => {
      mockChatService.processMessage.mockResolvedValue({
        response: 'Hi!',
        lead_captured: false,
        session_id: 'custom-session',
      });

      await controller.chat(
        { clientId: 'c1', message: 'Hi', sessionId: 'custom-session' },
        { ip: '127.0.0.1' },
      );

      expect(mockChatService.processMessage).toHaveBeenCalledWith(
        'c1',
        'Hi',
        'custom-session',
      );
    });

    it('should fall back to req.ip when sessionId is not provided', async () => {
      mockChatService.processMessage.mockResolvedValue({
        response: 'Hi!',
        lead_captured: false,
        session_id: 'ip-based',
      });

      await controller.chat(
        { clientId: 'c1', message: 'Hi' },
        { ip: '192.168.1.1' },
      );

      expect(mockChatService.processMessage).toHaveBeenCalledWith(
        'c1',
        'Hi',
        '192.168.1.1',
      );
    });
  });
});
