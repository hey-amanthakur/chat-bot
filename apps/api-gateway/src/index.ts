import { startChatServer } from './server';
import { getEnv } from './config';
import type { Server } from 'http';

export interface ClientConfig {
  name: string;
  tone?: string;
  greeting?: string;
  model?: string;
  max_tokens?: number;
  business_info?: {
    address?: string;
    phone?: string;
    email?: string;
  };
  services?: Array<{
    name: string;
    price: string;
    description: string;
  }>;
  hours?: Array<{
    day: string;
    open: string;
    close: string;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  policies?: string[];
}

export interface ChatBotConfig {
  port?: number;
  openrouterKey: string;
  openrouterBaseUrl?: string;
  clients: Record<string, ClientConfig>;
  allowedOrigins?: string[];
}

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
