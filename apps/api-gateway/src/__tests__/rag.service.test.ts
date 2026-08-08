import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import { RagService } from '../ai/services/rag.service';

const mockFs = {
  existsSync: (p: string) => p.endsWith('config.json') || p.endsWith('knowledge.md') || p.endsWith('test-client'),
  readFileSync: (p: string) => {
    if (p.endsWith('config.json')) return JSON.stringify({ name: 'Test' });
    if (p.endsWith('knowledge.md')) return '# Test KB';
    return '';
  },
} as any;

describe('RagService', () => {
  it('should load config.json and knowledge.md', async () => {
    const service = new RagService({ fs: mockFs, dataDir: '/test' });
    const kb = await service.getKnowledgeBase('test-client');
    assert.equal(kb.name, 'Test');
    assert.equal(kb.knowledge_text, '# Test KB');
  });

  it('should return default KB if client directory does not exist', async () => {
    const emptyFs = { existsSync: () => false } as any;
    const service = new RagService({ fs: emptyFs, dataDir: '/test' });
    const kb = await service.getKnowledgeBase('missing');
    assert.equal(kb.name, 'Business');
  });
});
