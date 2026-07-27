import { IsString, IsUUID, IsEmail, IsOptional, MaxLength, Matches } from 'class-validator';

export class LeadDto {
  @IsUUID()
  clientId: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  phone?: string;

  @IsString()
  @MaxLength(500)
  reason: string;

  @IsUUID()
  conversationId: string;
}
