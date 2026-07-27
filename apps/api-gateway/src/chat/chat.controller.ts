import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ChatService } from './chat.service';
import { ChatDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @Throttle('chat', { limit: 20, ttl: 60000 })
  async chat(@Body() chatDto: ChatDto, @Req() req: any) {
    return this.chatService.processMessage(
      chatDto.clientId,
      chatDto.message,
      chatDto.sessionId || req.ip,
    );
  }
}
