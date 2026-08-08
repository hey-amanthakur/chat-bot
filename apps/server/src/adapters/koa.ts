import { createChatServer, ServerOptions } from '../server';
import type Application from 'koa';

export function useChatBot(app: Application, options: ServerOptions = {}): Application {
  const server = createChatServer(options);
  app.on('request', (req, res) => {
    server.emit('request', req, res);
  });
  return app;
}
