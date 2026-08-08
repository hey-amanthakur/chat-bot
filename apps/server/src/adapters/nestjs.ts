import { createChatServer, ServerOptions } from '../server';
import type { INestApplication } from '@nestjs/common';

export function useChatBot(app: INestApplication, options: ServerOptions = {}): INestApplication {
  const server = createChatServer(options);
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance();
  
  if (typeof instance.use === 'function') {
    instance.use((req: any, res: any, next: any) => {
      if (req.url.startsWith('/api/') || req.url.startsWith('/widgets/')) {
        server.emit('request', req, res);
        return;
      }
      next();
    });
  }
  
  return app;
}
