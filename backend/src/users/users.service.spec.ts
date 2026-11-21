import { BadRequestException, ConflictException } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer, } from 'mongodb-memory-server';
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { User, UserSchema, UserStatus } from './schemas/user.schema';
import { UsersService } from './users.service';

describe('UsersService (Domain Invariants)', () => {
  let mongod: MongoMemoryServer;
  let moduleRef: TestingModule;
  let usersService: UsersService;

  before(async () => {
    mongod = await MongoMemoryServer.create();
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongod.getUri()),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [UsersService],
    }).compile();

    usersService = moduleRef.get(UsersService);
  });

  beforeEach(async () => {
    const paginated = await usersService.findWithPagination(1, 50);
    for (const user of paginated.items) {
      await usersService.remove(user.id);
    }
  });

  after(async () => {
    await moduleRef.close();
    await mongod.stop();
  });

  it('creates an active user with hashed password and loginsCounter = 0', async () => {
    const user = await usersService.create({
      firstName: 'Active',
      lastName: 'User 1',
      email: 'activeuser1@example.com',
      password: 'Password123!',
    });

    assert.equal(user.firstName, 'Active');
    assert.equal(user.lastName, 'User 1');
    assert.equal(user.status, UserStatus.ACTIVE);
    assert.equal(user.loginsCounter, 0);
    assert.ok(user.createdAt instanceof Date);
    assert.ok(user.updatedAt instanceof Date);

    const serialized = user.toJSON();
    assert.equal('passwordHash' in serialized, false);
  });

  it('prevents duplicate email registration', async () => {
    await usersService.create({
      firstName: 'Active',
      lastName: 'User 1',
      email: 'activeuser1@example.com',
      password: 'Password123!',
    });

    await assert.rejects(
      () =>
        usersService.create({
          firstName: 'Active',
          lastName: 'User 1',
          email: 'activeuser1@example.com',
          password: 'Password123!',
        }),
      ConflictException,
    );
  });

  it('forbids updating createdAt while always refreshing updatedAt', async () => {
    const user = await usersService.create({
      firstName: 'Nina',
      lastName: 'Williams',
      email: 'nina@example.com',
      password: 'Password123!',
    });

    const originalCreatedAt = user.createdAt.getTime();
    const originalUpdatedAt = user.updatedAt.getTime();

    await assert.rejects(
      () =>
        usersService.update(user.id, {
          firstName: 'Nina P.',
          createdAt: new Date('2020-01-01'),
        }),
      BadRequestException,
    );

    await new Promise((r) => setTimeout(r, 15));
    const updated = await usersService.update(user.id, { firstName: 'Nina P.' });

    assert.equal(updated.createdAt.getTime(), originalCreatedAt);
    assert.ok(updated.updatedAt.getTime() > originalUpdatedAt);
  });

  it('blocks firstName and lastName updates when user is inactive, but allows reactivating status', async () => {
    const user = await usersService.create({
      firstName: 'Alan',
      lastName: 'Turing',
      email: 'alan@example.com',
      password: 'Password123!',
      status: UserStatus.INACTIVE,
    });

    await assert.rejects(
      () => usersService.update(user.id, { firstName: 'A. M.' }),
      BadRequestException,
    );

    await assert.rejects(
      () => usersService.update(user.id, { lastName: 'Mathison' }),
      BadRequestException,
    );

    const reactivated = await usersService.update(user.id, { status: UserStatus.ACTIVE });
    assert.equal(reactivated.status, UserStatus.ACTIVE);

    const renamed = await usersService.update(user.id, { firstName: 'Alan Mathison' });
    assert.equal(renamed.firstName, 'Alan Mathison');
  });

  it('paginates users cleanly at 6 items per page', async () => {
    for (let i = 1; i <= 8; i++) {
      await usersService.create({
        firstName: `User${i}`,
        lastName: 'Test',
        email: `user${i}@example.com`,
        password: 'Password123!',
      });
    }

    const page1 = await usersService.findWithPagination(1, 6);
    const page2 = await usersService.findWithPagination(2, 6);

    assert.equal(page1.items.length, 6);
    assert.equal(page1.total, 8);
    assert.equal(page1.totalPages, 2);
    assert.equal(page2.items.length, 2);
  });
});
