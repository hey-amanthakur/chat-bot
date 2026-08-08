import express from 'express';
import { useChatBot } from '../../apps/server/src/adapters/express';

const app = express();
const port = 3000;

useChatBot(app);

app.listen(port, () => {
  console.log(`Express example running at http://localhost:${port}`);
});
