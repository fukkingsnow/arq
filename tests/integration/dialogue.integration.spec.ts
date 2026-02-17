import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DialogueService } from '../../src/services/dialogue.service';

describe('Dialogue Management Integration Tests', () => {
  let app: INestApplication;
  let dialogueService: DialogueService;
  let accessToken: string;
  let userId: string;
  let dialogueId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dialogueService = moduleFixture.get<DialogueService>(DialogueService);

    // Setup: Register and login a test user
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'dialogue-test@arq.ai',
        password: 'TestPassword123!',
        username: 'dialoguetest',
      });

    accessToken = registerRes.body.accessToken;
    userId = registerRes.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Dialogue Creation', () => {
    it('should create a new dialogue session', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/dialogues')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Dialogue',
          description: 'A test dialogue for integration testing',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2048,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Dialogue');
      expect(response.body.userId).toBe(userId);
      expect(response.body.model).toBe('gpt-4');
      expect(response.body.temperature).toBe(0.7);

      dialogueId = response.body.id;
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/dialogues')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'Missing title',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Dialogue Retrieval', () => {
    it('should retrieve all user dialogues', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dialogues')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('createdAt');
    });

    it('should retrieve specific dialogue by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/dialogues/${dialogueId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(dialogueId);
      expect(response.body.userId).toBe(userId);
      expect(response.body.title).toBe('Test Dialogue');
    });

    it('should return 404 for non-existent dialogue', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dialogues/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Dialogue Updates', () => {
    it('should update dialogue settings', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/dialogues/${dialogueId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Dialogue Title',
          temperature: 0.5,
          maxTokens: 1024,
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Dialogue Title');
      expect(response.body.temperature).toBe(0.5);
      expect(response.body.maxTokens).toBe(1024);
    });

    it('should allow partial updates', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/dialogues/${dialogueId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'New description',
        })
        .expect(200);

      expect(response.body.description).toBe('New description');
      expect(response.body.title).toBe('Updated Dialogue Title');
    });
  });

  describe('Message Management', () => {
    it('should send message to dialogue', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/dialogues/${dialogueId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Hello, how can you help me today?',
          role: 'user',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('Hello, how can you help me today?');
      expect(response.body.role).toBe('user');
      expect(response.body.dialogueId).toBe(dialogueId);
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
      expect(response.body[0]).toHaveProperty('timestamp');
    });

    it('should validate message role', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/dialogues/${dialogueId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Test message',
          role: 'invalid-role',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Dialogue Deletion', () => {
    let tempDialogueId: string;

    beforeAll(async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/dialogues')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Dialogue to Delete',
          model: 'gpt-4',
          temperature: 0.7,
        });

      tempDialogueId = createRes.body.id;
    });

    it('should delete dialogue', async () => {
      await request(app.getHttpServer())
        .delete(`/api/dialogues/${tempDialogueId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should return 404 for deleted dialogue', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/dialogues/${tempDialogueId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });
});
