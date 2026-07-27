import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('admin')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle('auth', { limit: 5, ttl: 900000 })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
