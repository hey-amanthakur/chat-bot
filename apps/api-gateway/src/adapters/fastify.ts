import { createChatServer, ServerOptions } from '../server';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export function useChatBot(app: FastifyInstance, options: ServerOptions = {}): FastifyInstance {
  const server = createChatServer(options);
  app.addHook('onRequest', (request: FastifyRequest, reply: FastifyReply, done) => {
    if (request.url.startsWith('/api/') || request.url.startsWith('/widgets/')) {
       server.emit('request', request.raw, reply.raw);
       return;
    }
    done();
  });
  return app;
}
