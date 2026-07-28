import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ChatService {
  private readonly aiServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
  }

  async processMessage(clientId: string, message: string, sessionId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/internal/chat`, {
          client_id: clientId,
          message,
          session_id: sessionId,
        }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException('Failed to process message', HttpStatus.BAD_GATEWAY);
    }
  }
}
