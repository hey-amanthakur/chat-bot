import { IsString, IsUUID, MaxLength, IsOptional } from 'class-validator';

export class ChatDto {
  @IsUUID()
  clientId: string;

  @IsString()
  @MaxLength(2000)
  message: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  sessionId?: string;
}
