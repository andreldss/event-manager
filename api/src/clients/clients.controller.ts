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
import { ClientsService } from './clients.service.js';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { hasAccess } from '../common/auth/has-access.js';
import { AuthUser } from 'src/common/types/auth-user.js';
import { AuditService } from '../audit/audit.service.js';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(
    private clientService: ClientsService,
    private auditService: AuditService,
  ) {}

  @Post()
  async register(@Req() req: any, @Body() body: CreateClientDto) {
    if (!hasAccess(req.user, 'recordsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para criar cadastros.',
      );
    }

    const created = await this.clientService.create(body);
    await this.auditService.log({
      module: 'clients',
      action: 'create',
      entityType: 'client',
      entityId: created.id,
      afterData: created,
      ...this.auditService.getContextFromRequest(req),
    });
    return created;
  }

  @Get()
  findAll(@Req() req: { user: AuthUser }) {
    if (!hasAccess(req.user, 'recordsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos cadastros.');
    }

    return this.clientService.getAll();
  }

  @Get('count')
  count(@Req() req: { user: AuthUser }) {
    return this.clientService.getCount();
  }

  @Get(':id')
  findOne(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!hasAccess(req.user, 'recordsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos cadastros.');
    }

    return this.clientService.getOne(id);
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateClientDto,
  ) {
    if (!hasAccess(req.user, 'recordsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para editar cadastros.',
      );
    }

    const beforeData = await this.clientService.getOne(id);
    const updated = await this.clientService.update(id, body);
    await this.auditService.log({
      module: 'clients',
      action: 'update',
      entityType: 'client',
      entityId: id,
      beforeData,
      afterData: updated,
      ...this.auditService.getContextFromRequest(req),
    });
    return updated;
  }

  @Delete(':id')
  async delete(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!hasAccess(req.user, 'recordsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir cadastros.',
      );
    }

    const beforeData = await this.clientService.getOne(id);
    const deleted = await this.clientService.delete(id);
    await this.auditService.log({
      module: 'clients',
      action: 'delete',
      entityType: 'client',
      entityId: id,
      beforeData,
      afterData: deleted,
      ...this.auditService.getContextFromRequest(req),
    });
    return deleted;
  }
}
