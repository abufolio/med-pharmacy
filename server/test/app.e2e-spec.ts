import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../apps/api/src/app.module';

/**
 * E2E test suite for the Pharmacy Cashback API.
 *
 * Run: npm run test:e2e
 *
 * NOTE: These tests require a running PostgreSQL and Redis instance.
 * The test database is configured via .env.test or environment variables.
 */

describe('Pharmacy Cashback API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same global configuration as main.ts
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.enableCors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ══════════════════════════════════════════════
  //  Health Check
  // ══════════════════════════════════════════════

  describe('GET /api/v1/health', () => {
    it('should return 200 with health status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('info.database');
          expect(res.body).toHaveProperty('info.memory');
        });
    });
  });

  // ══════════════════════════════════════════════
  //  Prometheus Metrics
  // ══════════════════════════════════════════════

  describe('GET /api/v1/metrics', () => {
    it('should return 200 with prometheus metrics', () => {
      return request(app.getHttpServer())
        .get('/api/v1/metrics')
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('# HELP');
          expect(res.text).toContain('# TYPE');
        });
    });
  });

  // ══════════════════════════════════════════════
  //  Auth Flow (requires seeded test data)
  // ══════════════════════════════════════════════

  describe('POST /api/v1/auth/login', () => {
    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ login: 'nonexistent', password: 'wrongpass' })
        .expect(401);
    });

    it('should return 400 for missing fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ login: 'test' })
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
        });
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return 401 for invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  // ══════════════════════════════════════════════
  //  Global Exception Filter
  // ══════════════════════════════════════════════

  describe('Global Exception Filter', () => {
    it('should return consistent error format', () => {
      return request(app.getHttpServer())
        .get('/api/v1/nonexistent-route')
        .expect(404)
        .expect((res) => {
          // Our AllExceptionsFilter wraps all errors
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toHaveProperty('code');
          expect(res.body.error).toHaveProperty('message');
          expect(res.body.error).toHaveProperty('details');
        });
    });
  });

  // ══════════════════════════════════════════════
  //  CORS Headers
  // ══════════════════════════════════════════════

  describe('CORS', () => {
    it('should include CORS headers on OPTIONS request', () => {
      return request(app.getHttpServer())
        .options('/api/v1/health')
        .expect('access-control-allow-origin', /http:\/\/localhost:3000/)
        .expect(204);
    });
  });
});
