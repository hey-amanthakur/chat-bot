import { IsString, MaxLength, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(100)
  slug: string;

  @IsEnum(['formal', 'casual', 'friendly'])
  @IsOptional()
  tone?: string = 'friendly';

  @IsBoolean()
  @IsOptional()
  leadCaptureEnabled?: boolean = true;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  leadNotificationMethod?: string = 'email';
}

export class UpdateClientDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsEnum(['formal', 'casual', 'friendly'])
  @IsOptional()
  tone?: string;

  @IsBoolean()
  @IsOptional()
  leadCaptureEnabled?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  leadNotificationMethod?: string;
}
