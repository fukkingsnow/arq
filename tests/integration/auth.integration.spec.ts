import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/services/auth.service';
import { JwtService } from '@nestjs/jwt';

describe('Authentication Integration Tests', () => {
  let app: INestApplication;
  let authService: AuthService;
  let jwtService: JwtService;
  let testUser = {
    email: 'auth-test@arq.ai',
    password: 'TestPassword123!',
    username: 'authtestuser',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should reject duplicate email registration', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already exists');
    });

    it('should validate email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!',
          username: 'newuser',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should enforce password requirements', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          username: 'weakpassword',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('User Login', () => {
    it('should login user with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('JWT Token Management', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should decode and validate JWT token', async () => {
      const decoded = jwtService.verify(accessToken);
      expect(decoded).toHaveProperty('sub');
      expect(decoded).toHaveProperty('email');
    });

    it('should refresh access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.accessToken).not.toBe(accessToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Authorization & Protected Routes', () => {
    let validToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      validToken = response.body.accessToken;
    });

    it('should allow access to protected route with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
    });

    it('should reject access to protected route without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/profile')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject access with malformed authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Logout', () => {
    let validToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      validToken = response.body.accessToken;
    });

    it('should logout user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject access with token after logout', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validToken}`);

      const response = await request(app.getHttpServer())
        .get('/api/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});
