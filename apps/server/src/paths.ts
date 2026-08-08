import * as path from 'path';

export function projectRoot(): string {
  // If we are in apps/server/dist or apps/server/src, we need to go 3 levels up
  if (__dirname.includes(path.join('apps', 'server'))) {
    return path.resolve(__dirname, '..', '..', '..');
  }
  // If we are in the root dist folder, we need to go 1 level up
  return path.resolve(__dirname, '..');
}

export function dataClientsDir(dataDir?: string): string {
  if (dataDir) return dataDir;
  return path.join(projectRoot(), 'data', 'clients');
}

export function dataLeadsDir(dataDir?: string): string {
  if (dataDir) return dataDir;
  return path.join(projectRoot(), 'data', 'leads');
}
