import express from 'express';
import { useChatBot } from '@hey-amanthakur/chat-bot/express';

const app = express();
const port = 3000;

useChatBot(app);

app.listen(port, () => {
  console.log(`Express example running at http://localhost:${port}`);
});
