import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { OpenRouterService } from './openrouter.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('OpenRouterService', () => {
  let service: OpenRouterService;
  let mockHttpService: jest.Mocked<HttpService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockHttpService = {
      post: jest.fn(),
    } as any;

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
          OPENROUTER_API_KEY: 'test-api-key',
        };
        return config[key] || defaultValue;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenRouterService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<OpenRouterService>(OpenRouterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildSystemPrompt', () => {
    it('should include business name in prompt', () => {
      const prompt = service.buildSystemPrompt({ name: 'My Salon' });
      expect(prompt).toContain('My Salon');
    });

    it('should use default name when not provided', () => {
      const prompt = service.buildSystemPrompt({});
      expect(prompt).toContain('this business');
    });

    it('should include tone in prompt', () => {
      const prompt = service.buildSystemPrompt({ name: 'X', tone: 'professional' });
      expect(prompt).toContain('professional');
    });

    it('should default to friendly tone', () => {
      const prompt = service.buildSystemPrompt({ name: 'X' });
      expect(prompt).toContain('friendly');
    });

    it('should include services', () => {
      const kb = {
        name: 'X',
        services: [
          { name: 'Haircut', price: '$45', description: 'Professional cut' },
        ],
      };
      const prompt = service.buildSystemPrompt(kb);
      expect(prompt).toContain('Haircut');
      expect(prompt).toContain('$45');
      expect(prompt).toContain('Professional cut');
    });

    it('should include hours', () => {
      const kb = {
        name: 'X',
        hours: [{ day: 'Monday', open: '9AM', close: '5PM' }],
      };
      const prompt = service.buildSystemPrompt(kb);
      expect(prompt).toContain('Monday');
      expect(prompt).toContain('9AM');
      expect(prompt).toContain('5PM');
    });

    it('should include FAQs', () => {
      const kb = {
        name: 'X',
        faqs: [{ question: 'Do you accept insurance?', answer: 'Yes.' }],
      };
      const prompt = service.buildSystemPrompt(kb);
      expect(prompt).toContain('Do you accept insurance?');
      expect(prompt).toContain('Yes.');
    });

    it('should include policies', () => {
      const kb = {
        name: 'X',
        policies: ['24hr cancellation'],
      };
      const prompt = service.buildSystemPrompt(kb);
      expect(prompt).toContain('24hr cancellation');
    });

    it('should include business info', () => {
      const kb = {
        name: 'X',
        business_info: {
          address: '123 Main St',
          phone: '555-1234',
          email: 'info@test.com',
        },
      };
      const prompt = service.buildSystemPrompt(kb);
      expect(prompt).toContain('123 Main St');
      expect(prompt).toContain('555-1234');
      expect(prompt).toContain('info@test.com');
    });

    it('should handle empty KB gracefully', () => {
      const prompt = service.buildSystemPrompt({});
      expect(prompt).toContain('this business');
      expect(prompt).toContain('friendly');
    });
  });

  describe('chatCompletion', () => {
    it('should return AI response on success', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          choices: [{ message: { content: 'Hello! How can I help?' } }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.chatCompletion('Hi', 'client1', { name: 'Test' });
      expect(result).toBe('Hello! How can I help?');
    });

    it('should call OpenRouter with correct parameters', async () => {
      const mockResponse: AxiosResponse = {
        data: { choices: [{ message: { content: 'Response' } }] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      await service.chatCompletion('Hello', 'client1', { name: 'Test' });

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          model: 'inclusionai/ling-3.0-flash:free',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'Hello' }),
          ]),
          max_tokens: 500,
          temperature: 0.7,
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
          timeout: 30000,
        }),
      );
    });

    it('should use custom model when specified in KB', async () => {
      const mockResponse: AxiosResponse = {
        data: { choices: [{ message: { content: 'Response' } }] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      await service.chatCompletion('Hi', 'c1', { name: 'X', model: 'custom-model' });

      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ model: 'custom-model' }),
        expect.any(Object),
      );
    });

    it('should handle HTTP errors gracefully', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => ({
          response: { status: 500, data: { error: 'Server error' } },
        })),
      );

      const result = await service.chatCompletion('Hi', 'c1', {});
      expect(result).toContain('temporary issue');
    });

    it('should handle network errors gracefully', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Network timeout')),
      );

      const result = await service.chatCompletion('Hi', 'c1', {});
      expect(result).toContain('trouble connecting');
    });
  });
});
