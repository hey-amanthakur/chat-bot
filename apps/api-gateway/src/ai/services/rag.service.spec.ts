import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RagService } from './rag.service';
import * as fs from 'fs';

jest.mock('fs');

describe('RagService', () => {
  let service: RagService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RagService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<RagService>(RagService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getKnowledgeBase', () => {
    it('should return in-memory client data if set', async () => {
      const clientData = {
        name: 'Test Business',
        services: [{ name: 'Haircut', price: '$45', description: 'Cut' }],
      };
      service.setClients({ 'test-client': clientData });

      const result = await service.getKnowledgeBase('test-client');
      expect(result).toEqual(clientData);
    });

    it('should return default KB when client not found on filesystem', async () => {
      mockConfigService.get.mockReturnValue('/nonexistent/path');
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await service.getKnowledgeBase('unknown-client');
      expect(result.name).toBe('Business');
      expect(result.services).toEqual([]);
      expect(result.faqs).toEqual([]);
    });

    it('should read config.json from filesystem when available', async () => {
      const configData = {
        name: 'File Business',
        services: [],
        faqs: [],
        hours: [],
        policies: [],
      };
      mockConfigService.get.mockReturnValue('/mock/data');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(configData));

      const result = await service.getKnowledgeBase('file-client');
      expect(result.name).toBe('File Business');
    });

    it('should return default KB when config.json does not exist', async () => {
      mockConfigService.get.mockReturnValue('/mock/data');
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(true) // client dir exists
        .mockReturnValueOnce(false); // config.json doesn't exist

      const result = await service.getKnowledgeBase('no-config-client');
      expect(result.name).toBe('Business');
    });
  });

  describe('retrieveContext', () => {
    it('should return services context', () => {
      const kb = {
        services: [
          { name: 'Haircut', price: '$45', description: 'Professional cut' },
          { name: 'Color', price: '$120', description: 'Full color' },
        ],
      };
      const context = service.retrieveContext(kb, 'test');
      expect(context).toContain('SERVICES:');
      expect(context).toContain('Haircut');
      expect(context).toContain('$45');
    });

    it('should return FAQs context', () => {
      const kb = {
        faqs: [{ question: 'Do you accept insurance?', answer: 'Yes.' }],
      };
      const context = service.retrieveContext(kb, 'test');
      expect(context).toContain('FAQS:');
      expect(context).toContain('Do you accept insurance?');
    });

    it('should return hours context', () => {
      const kb = {
        hours: [{ day: 'Monday', open: '9AM', close: '5PM' }],
      };
      const context = service.retrieveContext(kb, 'test');
      expect(context).toContain('HOURS:');
      expect(context).toContain('Monday');
    });

    it('should return policies context', () => {
      const kb = {
        policies: ['24hr cancellation required'],
      };
      const context = service.retrieveContext(kb, 'test');
      expect(context).toContain('POLICIES:');
      expect(context).toContain('24hr cancellation required');
    });

    it('should combine all sections', () => {
      const kb = {
        services: [{ name: 'A', price: '$1', description: 'desc' }],
        faqs: [{ question: 'Q', answer: 'A' }],
        hours: [{ day: 'Mon', open: '9', close: '5' }],
        policies: ['Policy 1'],
      };
      const context = service.retrieveContext(kb, 'test');
      expect(context).toContain('SERVICES:');
      expect(context).toContain('FAQS:');
      expect(context).toContain('HOURS:');
      expect(context).toContain('POLICIES:');
    });

    it('should return default message when KB is empty', () => {
      const context = service.retrieveContext({}, 'test');
      expect(context).toBe('No business information available.');
    });

    it('should handle partial KB data', () => {
      const kb = {
        services: [{ name: 'A', price: '$1', description: 'desc' }],
      };
      const context = service.retrieveContext(kb, 'test');
      expect(context).toContain('SERVICES:');
      expect(context).not.toContain('FAQS:');
      expect(context).not.toContain('HOURS:');
    });

    it('should handle services with missing price/description', () => {
      const kb = {
        services: [{ name: 'A' }],
      };
      const context = service.retrieveContext(kb, 'test');
      expect(context).toContain('A: N/A -');
    });
  });
});
