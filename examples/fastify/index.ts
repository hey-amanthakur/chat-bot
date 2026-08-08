import Fastify from 'fastify';
import { useChatBot } from '../../apps/server/src/adapters/fastify';

const fastify = Fastify({ logger: true });
const port = 3000;

useChatBot(fastify);

fastify.listen({ port }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
