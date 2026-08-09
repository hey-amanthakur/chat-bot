import { createChatServer, ServerOptions } from '../server';
import type { Express } from 'express';

export function useChatBot(app: Express, options: ServerOptions = {}): Express {
  const server = createChatServer(options);
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/') || req.url.startsWith('/widgets/')) {
      server.emit('request', req, res);
      return;
    }
    next();
  });
  return app;
}
