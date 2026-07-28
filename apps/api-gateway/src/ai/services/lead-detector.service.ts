import { Injectable } from '@nestjs/common';

export interface LeadDetection {
  detectLead: boolean;
  confidence: number;
  extractedInfo: Record<string, any> | null;
}

@Injectable()
export class LeadDetectorService {
  private readonly LEAD_KEYWORDS = [
    'contact',
    'call me',
    'phone number',
    'email me',
    'appointment',
    'book',
    'schedule',
    'speak to someone',
    'talk to a person',
    'representative',
    'agent',
    'human',
    'real person',
    'manager',
  ];

  private readonly LEAD_PATTERNS = [
    'my number is',
    'my email is',
    'you can reach me',
    'call me at',
    'email me at',
    'my name is',
  ];

  async detect(message: string, _context: string = ''): Promise<LeadDetection> {
    const messageLower = message.toLowerCase();

    const keywordMatches = this.LEAD_KEYWORDS.filter((kw) => messageLower.includes(kw)).length;

    const patternMatches = this.LEAD_PATTERNS.filter((p) => messageLower.includes(p)).length;

    const confidence = Math.min(keywordMatches * 0.15 + patternMatches * 0.3, 1.0);

    if (confidence >= 0.3) {
      return {
        detectLead: true,
        confidence,
        extractedInfo: { message },
      };
    }

    return {
      detectLead: false,
      confidence,
      extractedInfo: null,
    };
  }
}
