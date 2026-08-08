import Koa from 'koa';
import { useChatBot } from '../../apps/server/src/adapters/koa';

const app = new Koa();
const port = 3000;

useChatBot(app);

app.listen(port, () => {
  console.log(`Koa example running at http://localhost:${port}`);
});
