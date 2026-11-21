import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import { AppModule } from './app.module';
import { UserStatus } from './users/schemas/user.schema';

describe('Back-Office REST API (TDD Integration Spec)', () => {
  let mongod: MongoMemoryServer;
  let moduleRef: TestingModule;
  let app: INestApplication;

  before(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();

    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  after(async () => {
    await app?.close();
    await moduleRef?.close();
    await mongod?.stop();
  });

  it('rejects unauthenticated access to /api/users without x-session-id', async () => {
    await request(app.getHttpServer()).get('/api/users').expect(401);
  });

  it('executes full lifecycle: signup -> signin -> session check -> CRUD -> logout -> reject terminated session', async () => {
    // 1. Sign-up creates user + active session and increments loginsCounter to 1
    const signupRes = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'StrongPassword123',
      })
      .expect(201);

    const sessionId: string = signupRes.body.session.id;
    assert.ok(sessionId);
    assert.equal(signupRes.body.user.firstName, 'Admin');
    assert.equal(signupRes.body.user.loginsCounter, 1);

    // 2. Sign-in creates a second active session and increments loginsCounter to 2
    const signinRes = await request(app.getHttpServer())
      .post('/api/auth/signin')
      .send({
        email: 'admin@example.com',
        password: 'StrongPassword123',
      })
      .expect(200);

    assert.equal(signinRes.body.user.loginsCounter, 2);

    // 3. Verify active session via /api/auth/me
    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('x-session-id', sessionId)
      .expect(200);
    assert.equal(meRes.body.user.email, 'admin@example.com');

    // 4. Create a managed inactive user via protected /api/users
    const createdUserRes = await request(app.getHttpServer())
      .post('/api/users')
      .set('x-session-id', sessionId)
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'UserPass123',
        status: UserStatus.INACTIVE,
      })
      .expect(201);

    const managedUserId: string = createdUserRes.body.id;

    // 5. Inactive user cannot sign in (403 Forbidden)
    await request(app.getHttpServer())
      .post('/api/auth/signin')
      .send({
        email: 'jane@example.com',
        password: 'UserPass123',
      })
      .expect(403);

    // 6. Domain validation via HTTP: cannot update inactive user's name (400 Bad Request)
    await request(app.getHttpServer())
      .patch(`/api/users/${managedUserId}`)
      .set('x-session-id', sessionId)
      .send({ firstName: 'Janet' })
      .expect(400);

    // 7. Reactivate user, then update name
    await request(app.getHttpServer())
      .patch(`/api/users/${managedUserId}`)
      .set('x-session-id', sessionId)
      .send({ status: UserStatus.ACTIVE })
      .expect(200);

    const updatedUserRes = await request(app.getHttpServer())
      .patch(`/api/users/${managedUserId}`)
      .set('x-session-id', sessionId)
      .send({ firstName: 'Janet' })
      .expect(200);
    assert.equal(updatedUserRes.body.firstName, 'Janet');

    // 8. Paginated list returns max 6 per page
    const listRes = await request(app.getHttpServer())
      .get('/api/users?page=1&limit=6')
      .set('x-session-id', sessionId)
      .expect(200);
    assert.equal(listRes.body.limit, 6);
    assert.equal(listRes.body.total, 2);
    assert.equal(listRes.body.items.length, 2);

    // 9. Delete managed user
    await request(app.getHttpServer())
      .delete(`/api/users/${managedUserId}`)
      .set('x-session-id', sessionId)
      .expect(204);

    // 10. Terminate session (Logout)
    await request(app.getHttpServer())
      .delete(`/api/sessions/${sessionId}`)
      .set('x-session-id', sessionId)
      .expect(200);

    // 11. Terminated session can no longer access protected endpoints (401 Unauthorized)
    await request(app.getHttpServer())
      .get('/api/users')
      .set('x-session-id', sessionId)
      .expect(401);
  });
});
