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
import { AuditService } from '../audit/audit.service.js';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

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
  async create(@Req() req: any, @Body() body: CreateUserDto) {
    if (!hasAccess(req.user, 'usersAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para criar usuários.',
      );
    }

    const created = await this.usersService.create(body);
    await this.auditService.log({
      module: 'users',
      action: 'create',
      entityType: 'user',
      entityId: created.id,
      afterData: created,
      ...this.auditService.getContextFromRequest(req),
    });
    return created;
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ) {
    if (!hasAccess(req.user, 'usersAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para editar usuários.',
      );
    }

    const beforeData = await this.usersService.findOne(id);
    const updated = await this.usersService.update(id, body);
    await this.auditService.log({
      module: 'users',
      action: 'update',
      entityType: 'user',
      entityId: id,
      beforeData,
      afterData: updated,
      ...this.auditService.getContextFromRequest(req),
    });
    return updated;
  }

  @Delete(':id')
  async remove(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!hasAccess(req.user, 'usersAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir usuários.',
      );
    }

    const beforeData = await this.usersService.findOne(id);
    const removed = await this.usersService.remove(id);
    await this.auditService.log({
      module: 'users',
      action: 'delete',
      entityType: 'user',
      entityId: id,
      beforeData,
      afterData: removed,
      ...this.auditService.getContextFromRequest(req),
    });
    return removed;
  }
}
