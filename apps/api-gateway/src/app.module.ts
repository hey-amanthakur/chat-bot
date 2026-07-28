import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { AdminModule } from './admin/admin.module';
import { LeadsModule } from './leads/leads.module';
import { HealthModule } from './health/health.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: 900000,
        limit: 5,
      },
      {
        name: 'chat',
        ttl: 60000,
        limit: 20,
      },
      {
        name: 'leads',
        ttl: 60000,
        limit: 10,
      },
    ]),
    AuthModule,
    ChatModule,
    AdminModule,
    LeadsModule,
    HealthModule,
    AiModule,
  ],
})
export class AppModule {}
