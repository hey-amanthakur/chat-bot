import { createChatServer, ServerOptions } from '../server';
import type Application from 'koa';

export function useChatBot(app: Application, options: ServerOptions = {}): Application {
  const server = createChatServer(options);
  app.use(async (ctx, next) => {
    if (ctx.path.startsWith('/api/') || ctx.path.startsWith('/widgets/')) {
      server.emit('request', ctx.req, ctx.res);
      return;
    }
    await next();
  });
  return app;
}
