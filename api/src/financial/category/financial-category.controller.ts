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
import { CreateFinancialCategoryDto } from './dto/category.dto.js';
import { FinancialCategoryService } from './financial-category.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { hasAccess } from '../../common/auth/has-access.js';
import { AuthUser } from 'src/common/types/auth-user.js';
import { AuditService } from '../../audit/audit.service.js';

@UseGuards(JwtAuthGuard)
@Controller('financial-category')
export class FinancialCategoryController {
  constructor(
    private readonly service: FinancialCategoryService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  list(@Req() req: { user: AuthUser }) {
    if (!hasAccess(req.user, 'recordsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos cadastros.');
    }

    return this.service.list();
  }

  @Post()
  async create(
    @Req() req: any,
    @Body() body: CreateFinancialCategoryDto,
  ) {
    if (!hasAccess(req.user, 'recordsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para criar cadastros.',
      );
    }

    const created = await this.service.create(body.name);
    await this.auditService.log({
      module: 'financial_category',
      action: 'create',
      entityType: 'financial_category',
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
    @Body() body: CreateFinancialCategoryDto,
  ) {
    if (!hasAccess(req.user, 'recordsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para editar cadastros.',
      );
    }

    const beforeData = await this.service.getById(id);
    const updated = await this.service.update(id, body.name);
    await this.auditService.log({
      module: 'financial_category',
      action: 'update',
      entityType: 'financial_category',
      entityId: id,
      beforeData,
      afterData: updated,
      ...this.auditService.getContextFromRequest(req),
    });
    return updated;
  }

  @Get('count')
  count(@Req() req: { user: AuthUser }) {
    return this.service.getCount();
  }

  @Get(':id')
  getById(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!hasAccess(req.user, 'recordsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos cadastros.');
    }

    return this.service.getById(id);
  }

  @Delete(':id')
  async remove(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!hasAccess(req.user, 'recordsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir cadastros.',
      );
    }

    const beforeData = await this.service.getById(id);
    const removed = await this.service.remove(id);
    await this.auditService.log({
      module: 'financial_category',
      action: 'delete',
      entityType: 'financial_category',
      entityId: id,
      beforeData,
      afterData: removed,
      ...this.auditService.getContextFromRequest(req),
    });
    return removed;
  }
}
