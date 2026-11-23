import { ApiTags, ApiSecurity, ApiQuery } from '@nestjs/swagger'
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { SessionsService } from '../sessions/sessions.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatus } from './schemas/user.schema';
import { UsersService } from './users.service';
import { PAGINATION_DEFAULTS, SESSION_HEADER_KEY } from '../common/constants';

/**
 * Protected back-office CRUD endpoints for managing users.
 * All routes require a valid `x-session-id` header enforced by {@link SessionGuard}.
 */
@ApiTags('Users')
@ApiSecurity(SESSION_HEADER_KEY)
@Controller('users')
@UseGuards(SessionGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) { }

  /**
   * Creates a new user record (defaults to `active` status unless specified).
   */
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /**
   * Returns a paginated list of users (`6` items per page by default).
   */  
  @Get()
  @ApiQuery({ name: 'page', required: false, example: PAGINATION_DEFAULTS.DEFAULT_PAGE })
  @ApiQuery({ name: 'limit', required: false, example: PAGINATION_DEFAULTS.DEFAULT_LIMIT })
  findAll(
    @Query('page', new DefaultValuePipe(PAGINATION_DEFAULTS.DEFAULT_PAGE), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(PAGINATION_DEFAULTS.DEFAULT_LIMIT), ParseIntPipe) limit: number,
  ) {
    return this.usersService.findWithPagination(page, limit);
  }

  /**
   * Retrieves a single user by ID.
   */  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * Updates mutable user attributes and immediately revokes all open sessions
   * if the user's status transitions to `inactive`.
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const updated = await this.usersService.update(id, dto);
    if (dto.status === UserStatus.INACTIVE) {
      await this.sessionsService.terminateAllForUser(id);
    }
    return updated;
  }

  /**
   * Revokes all active sessions for the user and permanently deletes the user record.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.sessionsService.terminateAllForUser(id);
    await this.usersService.remove(id);
  }
}
