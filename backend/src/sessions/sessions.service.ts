import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserDocument, UserStatus } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { ActiveSessionContext, ISessionsService } from './interfaces/sessions-service.interface';
import { Session, SessionDocument } from './schemas/session.schema';
import { ERROR_MESSAGES } from '../common/constants'

@Injectable()
export class SessionsService implements ISessionsService {
  constructor(
    @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
    private readonly usersService: UsersService,
  ) { }

  async createForUser(userId: string): Promise<ActiveSessionContext> {
    const user = await this.usersService.findById(userId);

    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException(ERROR_MESSAGES.INACTIVE_USER_SESSION_FORBIDDEN);
    }

    const session = await this.sessionModel.create({
      userId: user._id,
      terminatedAt: null,
    });

    const updatedUser = (await this.usersService.incrementLoginsCounter(user.id)) ?? user;

    return { session, user: updatedUser };
  }

  async findActiveSession(sessionId: string): Promise<ActiveSessionContext> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_SESSION_ID);
    }

    const session = await this.sessionModel.findById(sessionId).exec();
    if (!session || session.terminatedAt !== null) {
      throw new UnauthorizedException(ERROR_MESSAGES.SESSION_INACTIVE_OR_EXPIRED);
    }

    const user: UserDocument = await this.usersService.findById(String(session.userId));
    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException(ERROR_MESSAGES.USER_ACCOUNT_INACTIVE);
    }

    return { session, user };
  }

  async terminate(sessionId: string): Promise<SessionDocument> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new NotFoundException(ERROR_MESSAGES.SESSION_NOT_FOUND);
    }

    const session = await this.sessionModel.findById(sessionId).exec();
    if (!session) {
      throw new NotFoundException(ERROR_MESSAGES.SESSION_NOT_FOUND);
    }

    if (session.terminatedAt === null) {
      session.terminatedAt = new Date();
      await session.save();
    }

    return session;
  }

  async terminateAllForUser(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) return;
    await this.sessionModel
      .updateMany(
        { userId: new Types.ObjectId(userId), terminatedAt: null },
        { $set: { terminatedAt: new Date() } },
      )
      .exec();
  }
}
