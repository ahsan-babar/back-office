import { UserDocument } from '../../users/schemas/user.schema';
import { SessionDocument } from '../schemas/session.schema';

export interface ActiveSessionContext {
  session: SessionDocument;
  user: UserDocument;
}

/**
 * Domain contract for authentication session lifecycle management.
 * Binds an active user account to an opaque session identifier passed via `x-session-id`.
 */
export interface ISessionsService {
  /**
   * Opens a new active session (`terminatedAt: null`) for an active user
   * and atomically increments the user's `loginsCounter`.
   *
   * @param userId - Target user ObjectId string.
   * @throws {ForbiddenException} If the target user's status is `inactive`.
   * @throws {NotFoundException} If the target user does not exist.
   */
  createForUser(userId: string): Promise<ActiveSessionContext>;

  /**
   * Validates that a session exists, is not terminated, and belongs to an `active` user.
   *
   * @param sessionId - Session ObjectId string from the `x-session-id` header.
   * @throws {UnauthorizedException} If the session ID is malformed, missing, or already terminated.
   * @throws {ForbiddenException} If the owning user account is `inactive`.
   */
  findActiveSession(sessionId: string): Promise<ActiveSessionContext>;

  /**
   * Terminates a single session by recording its `terminatedAt` timestamp.
   * Idempotent: preserves the original `terminatedAt` value if already terminated.
   *
   * @param sessionId - Session ObjectId string to terminate.
   * @throws {NotFoundException} If the session ID is invalid or not found.
   */
  terminate(sessionId: string): Promise<SessionDocument>;

  /**
   * Revokes all open sessions (`terminatedAt: null`) belonging to a user.
   * Invoked automatically when an administrator deactivates or deletes a user.
   *
   * @param userId - Target user ObjectId string.
   */
  terminateAllForUser(userId: string): Promise<void>;
}
