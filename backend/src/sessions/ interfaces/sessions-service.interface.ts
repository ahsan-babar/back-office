import { UserDocument } from '../../users/schemas/user.schema';
import { SessionDocument } from '../schemas/session.schema';

export interface ActiveSessionContext {
  session: SessionDocument;
  user: UserDocument;
}

export interface ISessionsService {
  createForUser(userId: string): Promise<ActiveSessionContext>;
  findActiveSession(sessionId: string): Promise<ActiveSessionContext>;
  terminate(sessionId: string): Promise<SessionDocument>;
  terminateAllForUser(userId: string): Promise<void>;
}
