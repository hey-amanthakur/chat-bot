import * as path from 'path';

export function projectRoot(): string {
  return path.resolve(__dirname, '..', '..', '..');
}

export function dataClientsDir(dataDir?: string): string {
  if (dataDir) return dataDir;
  return path.join(projectRoot(), 'data', 'clients');
}

export function dataLeadsDir(dataDir?: string): string {
  if (dataDir) return dataDir;
  return path.join(projectRoot(), 'data', 'leads');
}
