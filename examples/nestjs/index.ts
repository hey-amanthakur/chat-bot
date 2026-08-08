import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { useChatBot } from '../../apps/api-gateway/src/adapters/nestjs';

@Module({})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  useChatBot(app);
  await app.listen(3000);
}

bootstrap();
