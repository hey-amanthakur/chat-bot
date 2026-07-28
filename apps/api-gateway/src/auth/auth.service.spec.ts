import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    } as any;

    mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          ADMIN_EMAIL: 'admin@test.com',
          ADMIN_PASSWORD_HASH: '$2b$10$hashedpassword',
        };
        return config[key];
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access_token on valid credentials', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('admin@test.com', 'password123');
      expect(result.access_token).toBe('mock-jwt-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: 'admin@test.com',
        sub: 'admin',
      });
    });

    it('should throw UnauthorizedException for wrong email', async () => {
      await expect(
        service.login('wrong@test.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login('admin@test.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should compare password with stored hash', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login('admin@test.com', 'password123');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', '$2b$10$hashedpassword');
    });
  });

  describe('validateToken', () => {
    it('should return email and role from payload', async () => {
      const result = await service.validateToken({
        email: 'admin@test.com',
        sub: 'admin',
      });
      expect(result.email).toBe('admin@test.com');
      expect(result.role).toBe('admin');
    });
  });
});
