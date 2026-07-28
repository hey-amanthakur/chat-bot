import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class LeadDto {
  @IsString()
  @MaxLength(100)
  clientId: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @MaxLength(500)
  reason: string;

  @IsString()
  @MaxLength(100)
  conversationId: string;
}
