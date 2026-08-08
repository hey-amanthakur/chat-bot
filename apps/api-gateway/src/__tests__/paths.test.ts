import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import { projectRoot, dataClientsDir, dataLeadsDir } from '../paths';

describe('Paths', () => {
  it('should return projectRoot', () => {
    const root = projectRoot();
    assert.ok(root.length > 0);
    assert.ok(path.isAbsolute(root));
  });

  it('should return dataClientsDir', () => {
    const dir = dataClientsDir();
    assert.ok(dir.includes('data/clients'));
  });

  it('should return dataLeadsDir', () => {
    const dir = dataLeadsDir();
    assert.ok(dir.includes('data/leads'));
  });

  it('should respect custom dataDir', () => {
    const custom = '/tmp/custom';
    assert.equal(dataClientsDir(custom), custom);
    assert.equal(dataLeadsDir(custom), custom);
  });
});
