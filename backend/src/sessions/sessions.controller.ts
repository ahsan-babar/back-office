import { ApiTags, ApiSecurity } from '@nestjs/swagger'
import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { SessionsService } from './sessions.service';
import { SESSION_HEADER_KEY } from '../common/constants'

@Controller('sessions')
@UseGuards(SessionGuard)
@ApiTags('Sessions')
@ApiSecurity(SESSION_HEADER_KEY)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  @Delete(':id')
  terminate(@Param('id') id: string) {
    return this.sessionsService.terminate(id);
  }
}
