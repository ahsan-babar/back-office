import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { SessionsService } from './sessions.service';

@Controller('sessions')
@UseGuards(SessionGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  @Delete(':id')
  terminate(@Param('id') id: string) {
    return this.sessionsService.terminate(id);
  }
}
