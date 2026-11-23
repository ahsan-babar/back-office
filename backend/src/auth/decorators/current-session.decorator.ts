import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../guards/session.guard';

/**
 * Parameter decorator that extracts the authenticated `{ session, user }` context
 * populated by {@link SessionGuard} from the current HTTP request.
 *
 * @example
 * ```ts
 * @Get('me')
 * @UseGuards(SessionGuard)
 * getMe(@CurrentSession() auth: ActiveSessionContext) { ... }
 * ```
 */
export const CurrentSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.auth;
  },
);
