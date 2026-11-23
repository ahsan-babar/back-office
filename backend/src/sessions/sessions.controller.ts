import { ApiTags, ApiSecurity } from '@nestjs/swagger'
import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { SessionsService } from './sessions.service';
import { SESSION_HEADER_KEY } from '../common/constants'

/**
 * Protected endpoints for managing and terminating user authentication sessions.
 */
@ApiTags('Sessions')
@ApiSecurity(SESSION_HEADER_KEY)
@Controller('sessions')
@UseGuards(SessionGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  /**
   * Terminates an active session by setting its `terminatedAt` timestamp (sign-out flow),
   * invalidating the session ID for all subsequent requests.
   */
  @Delete(':id')
  terminate(@Param('id') id: string) {
    return this.sessionsService.terminate(id);
  }
}
