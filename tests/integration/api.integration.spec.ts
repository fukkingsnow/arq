import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/services/auth.service';
import { DialogueService } from '../../src/services/dialogue.service';

describe('API Integration Tests (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let dialogueService: DialogueService;
  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    dialogueService = moduleFixture.get<DialogueService>(DialogueService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Workflow', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'integration-test@arq.ai',
          password: 'TestPassword123!',
          username: 'integrationtest',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('integration-test@arq.ai');

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
      userId = response.body.user.id;
    });

    it('should authenticate user with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'integration-test@arq.ai',
          password: 'TestPassword123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('integration-test@arq.ai');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'integration-test@arq.ai',
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject expired refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid.expired.token' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('API Endpoints - Protected Routes', () => {
    it('should reject requests without authentication token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/profile')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should allow authenticated requests with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(userId);
    });

    it('should reject requests with malformed token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/profile')
        .set('Authorization', 'Bearer malformed.token.here')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Dialogue Management', () => {
    let dialogueId: string;

    it('should create a new dialogue session', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/dialogues')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Integration Test Dialogue',
          description: 'Testing dialogue creation',
          model: 'gpt-4',
          temperature: 0.7,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Integration Test Dialogue');
      expect(response.body.userId).toBe(userId);

      dialogueId = response.body.id;
    });

    it('should retrieve user dialogues', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dialogues')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
    });

    it('should get specific dialogue by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/dialogues/${dialogueId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(dialogueId);
      expect(response.body.title).toBe('Integration Test Dialogue');
    });

    it('should send message to dialogue', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/dialogues/${dialogueId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Hello AI, how are you?',
          role: 'user',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('Hello AI, how are you?');
      expect(response.body.role).toBe('user');
    });

    it('should retrieve dialogue messages', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/dialogues/${dialogueId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('content');
      expect(response.body[0]).toHaveProperty('role');
    });

    it('should update dialogue settings', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/dialogues/${dialogueId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Dialogue Title',
          temperature: 0.5,
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Dialogue Title');
      expect(response.body.temperature).toBe(0.5);
    });

    it('should delete dialogue', async () => {
      await request(app.getHttpServer())
        .delete(`/api/dialogues/${dialogueId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      const verifyResponse = await request(app.getHttpServer())
        .get(`/api/dialogues/${dialogueId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle validation errors', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'short',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle server errors gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.status).toBeLessThan(500);
    });
  });
});
