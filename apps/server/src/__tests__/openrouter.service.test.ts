import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OpenRouterService } from '../ai/services/openrouter.service';

function makeMockFetch(responses: Array<{ status: number; body: any; error?: Error }>) {
  let callIndex = 0;
  return {
    fetch: (url: string, init: any) => {
      const response = responses[Math.min(callIndex, responses.length - 1)];
      callIndex++;
      if (response.error) {
        return Promise.reject(response.error);
      }
      return Promise.resolve({
        ok: response.status < 400,
        status: response.status,
        statusText: response.status === 429 ? 'Too Many Requests' : 'OK',
        json: () => Promise.resolve(response.body),
        text: () => Promise.resolve(JSON.stringify(response.body)),
      } as Response);
    },
    getCalls: () => callIndex,
  };
}

describe('OpenRouterService', () => {
  it('should build a system prompt with business info', () => {
    const mockFetch = makeMockFetch([]);
    const service = new OpenRouterService({ apiKey: 'test-key', baseUrl: 'https://test.api', fetchFn: mockFetch.fetch as any });
    const kb = {
      name: 'Test Dental',
      tone: 'friendly',
      greeting: 'Hello!',
      business_info: { address: '123 St', phone: '555-1234', email: 'test@test.com' },
      services: [{ name: 'Cleaning', price: '$100', description: 'Basic cleaning' }],
      hours: [{ day: 'Monday', open: '9AM', close: '5PM' }],
      faqs: [{ question: 'Q1?', answer: 'A1' }],
      policies: ['No shows charged'],
      knowledge_text: 'Additional info here',
    };
    const prompt = service.buildSystemPrompt(kb);
    assert.ok(prompt.includes('Test Dental'));
    assert.ok(prompt.includes('Hello!'));
    assert.ok(prompt.includes('Cleaning'));
    assert.ok(prompt.includes('Additional info here'));
  });

  it('should return content from successful response', async () => {
    const mockFetch = makeMockFetch([
      { status: 200, body: { choices: [{ message: { content: 'Hello there!' } }] } },
    ]);
    const service = new OpenRouterService({ apiKey: 'test-key', baseUrl: 'https://test.api', fetchFn: mockFetch.fetch as any });
    const result = await service.chatCompletion('Hi', 'test-client', { name: 'Test' });
    assert.equal(result, 'Hello there!');
  });

  it('should return fallback message on non-429 HTTP error', async () => {
    const mockFetch = makeMockFetch([
      { status: 400, body: { error: 'bad' } },
    ]);
    const service = new OpenRouterService({ apiKey: 'test-key', baseUrl: 'https://test.api', fetchFn: mockFetch.fetch as any });
    const result = await service.chatCompletion('Hi', 'test-client', { name: 'Test' });
    assert.ok(result.includes('temporary issue'));
  });

  it('should try next model on 429 rate limit', async () => {
    const mockFetch = makeMockFetch([
      { status: 429, body: { error: 'rate limited' } },
      { status: 200, body: { choices: [{ message: { content: 'Success on fallback' } }] } },
    ]);
    const service = new OpenRouterService({ apiKey: 'test-key', baseUrl: 'https://test.api', fetchFn: mockFetch.fetch as any });
    const result = await service.chatCompletion('Hi', 'test-client', { name: 'Test' });
    assert.equal(result, 'Success on fallback');
    assert.equal(mockFetch.getCalls(), 2);
  });

  it('should return connection error on fetch failure', async () => {
    const mockFetch = makeMockFetch([
      { status: 500, body: {}, error: new Error('Network error') },
    ]);
    const service = new OpenRouterService({ apiKey: 'test-key', baseUrl: 'https://test.api', fetchFn: mockFetch.fetch as any });
    const result = await service.chatCompletion('Hi', 'test-client', { name: 'Test' });
    assert.ok(result.includes('trouble connecting'));
  });

  it('should use custom model from kb if provided', async () => {
    let capturedBody: any;
    const customMockFetch = (url: string, init: any) => {
      capturedBody = JSON.parse(init.body);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ choices: [{ message: { content: 'Response' } }] }),
        text: () => Promise.resolve('ok'),
      } as Response);
    };
    const service = new OpenRouterService({ apiKey: 'test-key', baseUrl: 'https://test.api', fetchFn: customMockFetch as any });
    await service.chatCompletion('Hi', 'test-client', { name: 'Test', model: 'custom/model:free' });
    assert.equal(capturedBody.model, 'custom/model:free');
  });
});
