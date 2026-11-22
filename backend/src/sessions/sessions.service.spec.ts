import { ForbiddenException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { User, UserSchema, UserStatus } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { Session, SessionSchema } from './schemas/session.schema';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
    let mongod: MongoMemoryServer;
    let moduleRef: TestingModule;
    let usersService: UsersService;
    let sessionsService: SessionsService;

    before(async () => {
        mongod = await MongoMemoryServer.create();
        moduleRef = await Test.createTestingModule({
            imports: [
                MongooseModule.forRoot(mongod.getUri()),
                MongooseModule.forFeature([
                    { name: User.name, schema: UserSchema },
                    { name: Session.name, schema: SessionSchema },
                ]),
            ],
            providers: [UsersService, SessionsService],
        }).compile();

        usersService = moduleRef.get(UsersService);
        sessionsService = moduleRef.get(SessionsService);
    });

    after(async () => {
        await moduleRef.close();
        await mongod.stop();
    });

    it('blocks inactive users from creating sessions', async () => {
        const inactiveUser = await usersService.create({
            firstName: 'Inactive',
            lastName: 'User',
            email: 'inactive@example.com',
            password: 'Password123!',
            status: UserStatus.INACTIVE,
        });

        await assert.rejects(
            () => sessionsService.createForUser(inactiveUser.id),
            ForbiddenException,
        );
    });

    it('creates an active session, increments loginsCounter, and terminates cleanly', async () => {
        const activeUser = await usersService.create({
            firstName: 'Paul',
            lastName: 'Walker',
            email: 'paul@walker.com',
            password: 'Password123!',
        });

        const { session, user } = await sessionsService.createForUser(activeUser.id);
        assert.equal(session.terminatedAt, null);
        assert.equal(user.loginsCounter, 1);

        const activeLookup = await sessionsService.findActiveSession(session.id);
        assert.equal(activeLookup.user.id, activeUser.id);

        const terminated = await sessionsService.terminate(session.id);
        assert.ok(terminated.terminatedAt instanceof Date);

        await assert.rejects(
            () => sessionsService.findActiveSession(session.id),
            UnauthorizedException,
        );
    });

    it('terminates sessions idempotently without overwriting original terminatedAt', async () => {
        const user = await usersService.create({
            firstName: 'Idempotent',
            lastName: 'User',
            email: 'idempotent@example.com',
            password: 'Password123!',
        });

        const { session } = await sessionsService.createForUser(user.id);
        const firstTermination = await sessionsService.terminate(session.id);
        assert.ok(firstTermination.terminatedAt instanceof Date);

        await new Promise((r) => setTimeout(r, 15));
        const secondTermination = await sessionsService.terminate(session.id);
        assert.equal(
            secondTermination.terminatedAt?.getTime(),
            firstTermination.terminatedAt.getTime(),
        );
    });

    it('revokes all active sessions for a user via terminateAllForUser', async () => {
        const user = await usersService.create({
            firstName: 'Multi',
            lastName: 'Device',
            email: 'multidevice@example.com',
            password: 'Password123!',
        });

        const s1 = await sessionsService.createForUser(user.id);
        const s2 = await sessionsService.createForUser(user.id);

        await sessionsService.terminateAllForUser(user.id);

        await assert.rejects(
            () => sessionsService.findActiveSession(s1.session.id),
            UnauthorizedException,
        );
        await assert.rejects(
            () => sessionsService.findActiveSession(s2.session.id),
            UnauthorizedException,
        );
    });

    it('rejects active session lookup if user becomes inactive after login', async () => {
        const user = await usersService.create({
            firstName: 'Flip',
            lastName: 'Status',
            email: 'flip@example.com',
            password: 'Password123!',
        });

        const { session } = await sessionsService.createForUser(user.id);
        await usersService.update(user.id, { status: UserStatus.INACTIVE });

        await assert.rejects(
            () => sessionsService.findActiveSession(session.id),
            ForbiddenException,
        );
    });

    it('handles invalid ObjectIds and missing sessions cleanly', async () => {
        const missingId = '507f1f77bcf86cd799439011';

        await assert.rejects(
            () => sessionsService.findActiveSession('bad-id'),
            UnauthorizedException,
        );
        await assert.rejects(() => sessionsService.terminate('bad-id'), NotFoundException);
        await assert.rejects(() => sessionsService.terminate(missingId), NotFoundException);
    });

});
