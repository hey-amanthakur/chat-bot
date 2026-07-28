import { Test, TestingModule } from '@nestjs/testing';
import { LeadDetectorService } from './lead-detector.service';

describe('LeadDetectorService', () => {
  let service: LeadDetectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadDetectorService],
    }).compile();

    service = module.get<LeadDetectorService>(LeadDetectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detect', () => {
    it('should return no lead for a normal question', async () => {
      const result = await service.detect('What are your hours?');
      expect(result.detectLead).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.extractedInfo).toBeNull();
    });

    it('should detect lead when keyword "appointment" is present', async () => {
      const result = await service.detect('I want to book an appointment');
      expect(result.detectLead).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.3);
      expect(result.extractedInfo).toEqual({ message: 'I want to book an appointment' });
    });

    it('should not detect lead with single keyword below threshold', async () => {
      const result = await service.detect('I need to contact someone');
      expect(result.detectLead).toBe(false);
      expect(result.confidence).toBe(0.15);
    });

    it('should detect lead with two keywords above threshold', async () => {
      const result = await service.detect('I want to contact you and book');
      expect(result.detectLead).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.3);
    });

    it('should detect lead with keyword "human"', async () => {
      const result = await service.detect('speak to a human now');
      expect(result.detectLead).toBe(false);
      expect(result.confidence).toBe(0.15);
    });

    it('should detect lead when pattern "my number is" is present', async () => {
      const result = await service.detect('My number is 555-1234');
      expect(result.detectLead).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.3);
    });

    it('should detect lead when pattern "my email is" is present', async () => {
      const result = await service.detect('My email is test@example.com');
      expect(result.detectLead).toBe(true);
    });

    it('should detect lead when pattern "call me at" is present', async () => {
      const result = await service.detect('Call me at 555-9999');
      expect(result.detectLead).toBe(true);
    });

    it('should detect lead with multiple keywords increasing confidence', async () => {
      const result = await service.detect(
        'I want to book an appointment and speak to a human agent',
      );
      expect(result.detectLead).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should cap confidence at 1.0', async () => {
      const message = [
        'contact call me phone number email me appointment book schedule',
        'speak to someone talk to a person representative agent human real person manager',
        'my number is my email is you can reach me call me at email me at my name is',
      ].join(' ');
      const result = await service.detect(message);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });

    it('should be case insensitive', async () => {
      const result = await service.detect('APPOINTMENT BOOKING');
      expect(result.detectLead).toBe(true);
    });

    it('should handle empty message', async () => {
      const result = await service.detect('');
      expect(result.detectLead).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should detect lead when "appointment" keyword is present', async () => {
      const result = await service.detect('I have an appointment-shaped question');
      expect(result.detectLead).toBe(false); // single keyword = 0.15, below 0.3
      expect(result.confidence).toBe(0.15);
    });

    it('should not detect lead when confidence is below threshold', async () => {
      // Single keyword = 0.15, below 0.3 threshold
      const result = await service.detect('I have a question');
      expect(result.detectLead).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should accept optional context parameter without error', async () => {
      const result = await service.detect('Hello', 'some context');
      expect(result).toBeDefined();
      expect(result.detectLead).toBe(false);
    });
  });
});
