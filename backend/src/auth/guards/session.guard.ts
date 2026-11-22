import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ActiveSessionContext } from '../../sessions/interfaces/sessions-service.interface';
import { SessionsService } from '../../sessions/sessions.service';
import { SESSION_HEADER_KEY, ERROR_MESSAGES } from '../../common/constants';

export interface AuthenticatedRequest extends Request {
  auth?: ActiveSessionContext;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessionsService: SessionsService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const rawHeader = request.headers[SESSION_HEADER_KEY];
    const sessionId = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!sessionId || typeof sessionId !== 'string') {
      throw new UnauthorizedException(ERROR_MESSAGES.MISSING_SESSION_HEADER);
    }

    request.auth = await this.sessionsService.findActiveSession(sessionId.trim());
    return true;
  }
}
