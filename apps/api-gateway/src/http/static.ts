import * as fs from 'fs';
import * as path from 'path';
import { sendText, contentTypeFor, sendJson } from './types';

export interface StaticRoot {
  prefix: string;
  rootDir: string;
}

function isSafeWithin(rootDir: string, filePath: string): boolean {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedFile = path.resolve(filePath);
  return resolvedFile === resolvedRoot || resolvedFile.startsWith(resolvedRoot + path.sep);
}

export async function serveStatic(
  req: import('http').IncomingMessage,
  res: import('http').ServerResponse,
  pathname: string,
  roots: StaticRoot[],
): Promise<boolean> {
  for (const root of roots) {
    if (!pathname.startsWith(root.prefix)) continue;

    const rel = pathname.slice(root.prefix.length).replace(/^\/+/, '');
    if (!rel) return false;

    const filePath = path.join(root.rootDir, ...rel.split('/'));
    if (!isSafeWithin(root.rootDir, filePath)) {
      sendJson(res, 403, { statusCode: 403, message: ['Forbidden'], error: 'Forbidden' });
      return true;
    }

    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) {
        sendText(res, 404, 'Not Found');
        return true;
      }
      res.writeHead(200, {
        'Content-Type': contentTypeFor(filePath),
        'Content-Length': stat.size,
        'Cache-Control': 'public, max-age=3600',
      });
      await new Promise<void>((resolve) => {
        const stream = fs.createReadStream(filePath);
        stream.on('error', () => {
          if (!res.writableEnded) sendText(res, 500, 'Internal Server Error');
          resolve();
        });
        stream.on('end', () => resolve());
        stream.pipe(res);
      });
      return true;
    } catch {
      sendText(res, 404, 'Not Found');
      return true;
    }
  }
  return false;
}
