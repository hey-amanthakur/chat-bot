import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ChatModule } from './chat/chat.module';
import { LeadsModule } from './leads/leads.module';
import { HealthModule } from './health/health.module';
import { AiModule } from './ai/ai.module';
import { RagService } from './ai/services/rag.service';

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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'chat', ttl: 60000, limit: 20 },
      { name: 'leads', ttl: 60000, limit: 10 },
    ]),
    ChatModule,
    LeadsModule,
    HealthModule,
    AiModule,
  ],
})
class ChatBotModule {}

async function bootstrap(config: ChatBotConfig) {
  const app = await NestFactory.create<NestExpressApplication>(ChatBotModule);

  const isDev = process.env.NODE_ENV !== 'production';
  const allowedOrigins = config.allowedOrigins || (isDev ? true : []);

  app.enableCors({
    origin: isDev && !config.allowedOrigins ? true : allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Serve widget files — use __dirname so it works when installed as npm package
  const widgetDist = join(__dirname, '..', 'widgets');
  if (existsSync(widgetDist)) {
    app.useStaticAssets(widgetDist, { prefix: '/widgets/' });
  }

  app.setGlobalPrefix('api');

  // Inject client data into RAG service
  const ragService = app.get(RagService);
  ragService.setClients(config.clients);

  const port = config.port || 3000;
  await app.listen(port);

  const url = `http://localhost:${port}`;
  console.log(`\n  ChatBot running at ${url}`);
  console.log(`  Widget: ${url}/widgets/chat-widget.min.js`);
  console.log(`  Health: ${url}/api/health\n`);

  return { app, url };
}

export { ChatBotModule };

export const ChatBot = {
  async start(config: ChatBotConfig) {
    // Set env vars from config
    process.env.OPENROUTER_API_KEY = config.openrouterKey;
    if (config.openrouterBaseUrl) {
      process.env.OPENROUTER_BASE_URL = config.openrouterBaseUrl;
    }

    return bootstrap(config);
  },
};
