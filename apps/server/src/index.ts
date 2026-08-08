import { startChatServer } from './server';
import { getEnv } from './config';
import type { Server } from 'http';
import type { ChatBotConfig } from '@chat-bot/shared';

export type { ClientConfig, ChatBotConfig } from '@chat-bot/shared';

export interface ChatBotStartResult {
  app: Server;
  url: string;
}

export const ChatBot = {
  async start(config: ChatBotConfig): Promise<ChatBotStartResult> {
    process.env.OPENROUTER_API_KEY = config.openrouterKey;
    if (config.openrouterBaseUrl) {
      process.env.OPENROUTER_BASE_URL = config.openrouterBaseUrl;
    }
    if (config.allowedOrigins) {
      process.env.ALLOWED_ORIGINS = config.allowedOrigins.join(',');
    }

    const env = getEnv();
    const { server, url } = await startChatServer({
      env,
      port: config.port,
      clients: config.clients as Record<string, Record<string, any>>,
    });
    return { app: server, url };
  },
};
