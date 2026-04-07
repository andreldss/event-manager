import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { hasAccess } from '../common/auth/has-access.js';
import { AuthUser } from 'src/common/types/auth-user.js';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('count')
  count(@Req() req: { user: AuthUser }) {
    return this.usersService.count();
  }

  @Get()
  findAll(@Req() req: { user: AuthUser }) {
    if (!hasAccess(req.user, 'usersAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos usuários.');
    }

    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!hasAccess(req.user, 'usersAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos usuários.');
    }

    return this.usersService.findOne(id);
  }

  @Post()
  create(@Req() req: { user: AuthUser }, @Body() body: CreateUserDto) {
    if (!hasAccess(req.user, 'usersAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para criar usuários.',
      );
    }

    return this.usersService.create(body);
  }

  @Patch(':id')
  update(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ) {
    if (!hasAccess(req.user, 'usersAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para editar usuários.',
      );
    }

    return this.usersService.update(id, body);
  }

  @Delete(':id')
  remove(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!hasAccess(req.user, 'usersAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir usuários.',
      );
    }

    return this.usersService.remove(id);
  }
}
