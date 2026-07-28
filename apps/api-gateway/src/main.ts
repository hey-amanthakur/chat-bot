import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const isDev = process.env.NODE_ENV !== 'production';
  const allowedOrigins = isDev ? true : process.env.ALLOWED_ORIGINS?.split(',') || [];

  app.enableCors({
    origin: isDev ? true : allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Serve static files: widget dist, demo page
  const cwd = process.cwd();
  const dockerWidgetDist = join(cwd, 'widgets-dist');
  const devWidgetDist = join(cwd, '..', '..', 'widgets', 'chat-widget', 'dist');
  const widgetDist = fs.existsSync(dockerWidgetDist) ? dockerWidgetDist : devWidgetDist;

  const devProjectRoot = join(cwd, '..', '..');
  const projectRoot = fs.existsSync(dockerWidgetDist) ? cwd : devProjectRoot;

  app.useStaticAssets(widgetDist, { prefix: '/widgets/' });
  app.useStaticAssets(projectRoot, { prefix: '/' });

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`API Gateway running on http://localhost:${port}`);
}
bootstrap();
