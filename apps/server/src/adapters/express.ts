import { createChatServer, ServerOptions } from '../server';
import type { Express } from 'express';

export function useChatBot(app: Express, options: ServerOptions = {}): Express {
  const server = createChatServer(options);
  app.use((req, res) => {
    server.emit('request', req, res);
  });
  return app;
}
