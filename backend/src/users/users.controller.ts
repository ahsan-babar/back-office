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
  
  @Controller('users')
  @UseGuards(SessionGuard)
  export class UsersController {
    constructor(
      private readonly usersService: UsersService,
      private readonly sessionsService: SessionsService,
    ) {}
  
    @Post()
    create(@Body() dto: CreateUserDto) {
      return this.usersService.create(dto);
    }
  
    @Get()
    findAll(
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('limit', new DefaultValuePipe(6), ParseIntPipe) limit: number,
    ) {
      return this.usersService.findWithPagination(page, limit);
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.usersService.findById(id);
    }
  
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
      const updated = await this.usersService.update(id, dto);
      if (dto.status === UserStatus.INACTIVE) {
        await this.sessionsService.terminateAllForUser(id);
      }
      return updated;
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
      await this.sessionsService.terminateAllForUser(id);
      await this.usersService.remove(id);
    }
  }
  