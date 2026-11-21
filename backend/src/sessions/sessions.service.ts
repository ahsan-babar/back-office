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

@Injectable()
export class SessionsService implements ISessionsService {
  constructor(
    @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
    private readonly usersService: UsersService,
  ) { }

  async createForUser(userId: string): Promise<ActiveSessionContext> {
    const user = await this.usersService.findById(userId);

    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('Inactive users cannot create sessions');
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
      throw new UnauthorizedException('Invalid session identifier');
    }

    const session = await this.sessionModel.findById(sessionId).exec();
    if (!session || session.terminatedAt !== null) {
      throw new UnauthorizedException('Session is inactive or expired');
    }

    const user: UserDocument = await this.usersService.findById(String(session.userId));
    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('User account is inactive');
    }

    return { session, user };
  }

  async terminate(sessionId: string): Promise<SessionDocument> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new NotFoundException('Session not found');
    }

    const session = await this.sessionModel.findById(sessionId).exec();
    if (!session) {
      throw new NotFoundException('Session not found');
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
