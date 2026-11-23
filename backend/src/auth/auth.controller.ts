import { ApiTags, ApiSecurity } from '@nestjs/swagger'
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { } from '@nestjs/swagger'
import { ActiveSessionContext } from '../sessions/interfaces/sessions-service.interface';
import { SessionsService } from '../sessions/sessions.service';
import { UserStatus } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { CurrentSession } from './decorators/current-session.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { SessionGuard } from './guards/session.guard';
import { SESSION_HEADER_KEY } from '../common/constants'

/**
 * Handles public registration, credential sign-in, and active session inspection.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) { }

  /**
   * Registers a new active user account and opens an initial authenticated session,
   * setting `loginsCounter` to `1`.
   */
  @Post('signup')
  async signUp(@Body() dto: SignUpDto) {
    const createdUser = await this.usersService.create({
      ...dto,
      status: UserStatus.ACTIVE,
    });
    const { session, user } = await this.sessionsService.createForUser(createdUser.id);
    return { session, user };
  }

  /**
   * Verifies email and password credentials, creates a new session,
   * and atomically increments `loginsCounter`.
   *
   * @throws {UnauthorizedException} If credentials are invalid.
   * @throws {ForbiddenException} If the user account is `inactive`.
   */
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() dto: SignInDto) {
    const existingUser = await this.usersService.findByEmailWithPassword(dto.email);
    if (!existingUser) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.usersService.verifyPassword(
      dto.password,
      existingUser.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { session, user } = await this.sessionsService.createForUser(existingUser.id);
    return { session, user };
  }

  /**
   * Returns the active session and user profile bound to the `x-session-id` header.
   */
  @Get('me')
  @ApiSecurity(SESSION_HEADER_KEY)
  @UseGuards(SessionGuard)
  getCurrentSession(@CurrentSession() auth: ActiveSessionContext) {
    return {
      session: auth.session,
      user: auth.user,
    };
  }
}
