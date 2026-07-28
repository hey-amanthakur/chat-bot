import { IsString, MaxLength, IsOptional } from 'class-validator';

export class ChatDto {
  @IsString()
  @MaxLength(100)
  clientId: string;

  @IsString()
  @MaxLength(2000)
  message: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  sessionId?: string;
}
