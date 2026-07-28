import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';

const mockOpenRouterResponse = (content: string): AxiosResponse => ({
  data: { choices: [{ message: { content } }] },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

describe('ChatBot E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
    process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-!!';
    process.env.ADMIN_EMAIL = 'admin@test.com';
    process.env.ADMIN_PASSWORD_HASH = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHJKLMNPQRSTUVWXYZ12345678';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue({
        post: jest.fn().mockReturnValue(
          of(mockOpenRouterResponse('We offer dental services including checkups and cleaning.')),
        ),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('GET /api/health', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.service).toBe('api-gateway');
          expect(res.body.timestamp).toBeDefined();
        });
    });
  });

  describe('Chat', () => {
    it('POST /api/chat - returns response for valid message', () => {
      return request(app.getHttpServer())
        .post('/api/chat')
        .send({
          clientId: 'dr-smith-dental',
          message: 'What services do you offer?',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.response).toBeDefined();
          expect(typeof res.body.response).toBe('string');
          expect(res.body.lead_captured).toBe(false);
          expect(res.body.session_id).toBeDefined();
        });
    });

    it('POST /api/chat - detects lead with booking intent', () => {
      return request(app.getHttpServer())
        .post('/api/chat')
        .send({
          clientId: 'dr-smith-dental',
          message: 'I want to book an appointment',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.lead_captured).toBe(true);
          expect(res.body.response).toContain('connect you with our team');
        });
    });

    it('POST /api/chat - detects lead with contact info pattern', () => {
      return request(app.getHttpServer())
        .post('/api/chat')
        .send({
          clientId: 'dr-smith-dental',
          message: 'My number is 555-1234 and I want to book',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.lead_captured).toBe(true);
        });
    });

    it('POST /api/chat - uses provided sessionId', () => {
      return request(app.getHttpServer())
        .post('/api/chat')
        .send({
          clientId: 'dr-smith-dental',
          message: 'Hello',
          sessionId: 'my-custom-session',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.session_id).toBe('my-custom-session');
        });
    });

    it('POST /api/chat - rejects missing clientId', () => {
      return request(app.getHttpServer())
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(400);
    });

    it('POST /api/chat - rejects missing message', () => {
      return request(app.getHttpServer())
        .post('/api/chat')
        .send({ clientId: 'dr-smith-dental' })
        .expect(400);
    });

    it('POST /api/chat - rejects message exceeding 2000 chars', () => {
      return request(app.getHttpServer())
        .post('/api/chat')
        .send({
          clientId: 'dr-smith-dental',
          message: 'a'.repeat(2001),
        })
        .expect(400);
    });

    it('POST /api/chat - rejects unknown fields', () => {
      return request(app.getHttpServer())
        .post('/api/chat')
        .send({
          clientId: 'dr-smith-dental',
          message: 'Hello',
          unknownField: 'should fail',
        })
        .expect(400);
    });
  });

  describe('Auth', () => {
    it('POST /api/admin/login - rejects invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/admin/login')
        .send({ email: 'wrong@test.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('POST /api/admin/login - rejects invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/admin/login')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(400);
    });

    it('POST /api/admin/login - rejects short password', () => {
      return request(app.getHttpServer())
        .post('/api/admin/login')
        .send({ email: 'admin@test.com', password: 'short' })
        .expect(400);
    });
  });

  describe('Leads', () => {
    it('GET /api/leads/:clientId - returns leads array', () => {
      return request(app.getHttpServer())
        .get('/api/leads/dr-smith-dental')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('POST /api/leads - creates a lead', () => {
      return request(app.getHttpServer())
        .post('/api/leads')
        .send({
          clientId: 'dr-smith-dental',
          name: 'Test User',
          reason: 'Testing',
          conversationId: 'test-conv',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.clientId).toBe('dr-smith-dental');
          expect(res.body.name).toBe('Test User');
          expect(res.body.id).toContain('lead-');
        });
    });

    it('POST /api/leads - rejects missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/leads')
        .send({ clientId: 'dr-smith-dental' })
        .expect(400);
    });
  });
});
