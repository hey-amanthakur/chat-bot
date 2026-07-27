import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPasswordHash = this.configService.get<string>('ADMIN_PASSWORD_HASH');

    if (email !== adminEmail) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, adminPasswordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email, sub: 'admin' };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateToken(payload: any) {
    return { email: payload.email, role: payload.sub };
  }
}
