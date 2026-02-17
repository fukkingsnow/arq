import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../app.module';
import * as request from 'supertest';

describe('Task Lifecycle E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Task Creation and Processing (E2E)', () => {
    let taskId: string;

    it('POST /tasks - should create a new task', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({
          type: 'process',
          priority: 'high',
          data: {
            message: 'E2E test task',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('pending');
      taskId = response.body.id;
    });

    it('GET /tasks/:id - should retrieve created task', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .expect(200);

      expect(response.body.id).toBe(taskId);
      expect(response.body.type).toBe('process');
    });

    it('GET /tasks - should list all tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('PATCH /tasks/:id - should update task status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .send({
          status: 'processing',
        })
        .expect(200);

      expect(response.body.status).toBe('processing');
    });
  });

  describe('Task Queue Operations (E2E)', () => {
    it('GET /queue/length - should get queue length', async () => {
      const response = await request(app.getHttpServer())
        .get('/queue/length')
        .expect(200);

      expect(response.body).toHaveProperty('length');
      expect(typeof response.body.length).toBe('number');
    });

    it('POST /queue/enqueue - should enqueue task', async () => {
      const response = await request(app.getHttpServer())
        .post('/queue/enqueue')
        .send({
          id: 'e2e-queue-task',
          type: 'process',
          data: {},
        })
        .expect(201);

      expect(response.body).toBeDefined();
    });
  });

  describe('WebSocket Events (E2E)', () => {
    it('should establish WebSocket connection', (done) => {
      const io = require('socket.io-client');
      const socket = io(`http://localhost:${process.env.PORT || 3000}`);

      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        socket.disconnect();
        done();
      });

      socket.on('connect_error', (error: any) => {
        done(error);
      });
    });

    it('should receive task update events', (done) => {
      const io = require('socket.io-client');
      const socket = io(`http://localhost:${process.env.PORT || 3000}`);

      socket.on('connect', () => {
        socket.on('taskUpdate', (data: any) => {
          expect(data).toHaveProperty('id');
          expect(data).toHaveProperty('status');
          socket.disconnect();
          done();
        });
      });
    });
  });

  describe('Error Handling (E2E)', () => {
    it('POST /tasks - should return 400 for invalid task', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('GET /tasks/:id - should return 404 for non-existent task', async () => {
      await request(app.getHttpServer())
        .get('/tasks/non-existent-id')
        .expect(404);
    });
  });

  describe('Performance Baseline (E2E)', () => {
    it('should handle task creation within acceptable time', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/tasks')
        .send({
          type: 'process',
          priority: 'medium',
          data: { message: 'Performance test' },
        })
        .expect(201);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should retrieve task list within acceptable time', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/tasks')
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });
  });
});
