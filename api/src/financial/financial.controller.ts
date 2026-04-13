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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FinancialService } from './financial.service.js';
import { CreateTransactionDto } from './dto/financial.dto.js';
import { UpdateTransactionDto } from './dto/update-financial.dto.js';
import { hasAccess } from '../common/auth/has-access.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AuthUser } from 'src/common/types/auth-user.js';
import { AuditService } from '../audit/audit.service.js';

@UseGuards(JwtAuthGuard)
@Controller('financial')
export class FinancialController {
  constructor(
    private readonly service: FinancialService,
    private readonly auditService: AuditService,
  ) {}

  private ensureAdmin(user: AuthUser) {
    if (!user?.isAdmin) {
      throw new ForbiddenException(
        'Somente administradores podem editar ou excluir movimentações.',
      );
    }
  }

  @Get()
  listAll(
    @Req() req: { user: AuthUser },
    @Query('eventId') eventId?: string,
    @Query('search') search?: string,
    @Query('type') type?: 'income' | 'expense',
    @Query('status') status?: 'planned' | 'settled',
    @Query('categoryId') categoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (!hasAccess(req.user, 'financialAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso ao financeiro.');
    }

    return this.service.listAll({
      eventId: eventId ? Number(eventId) : undefined,
      search,
      type,
      status,
      categoryId: categoryId ? Number(categoryId) : undefined,
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Post()
  async createGlobal(
    @Req() req: any,
    @Body() body: CreateTransactionDto,
  ) {
    if (!hasAccess(req.user, 'financialAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para criar movimentações.',
      );
    }

    const created = await this.service.create(body);
    await this.auditService.log({
      module: 'financial',
      action: 'create',
      entityType: 'financial_transaction',
      entityId: created.id,
      eventId: created.eventId ?? body.eventId ?? null,
      afterData: created,
      ...this.auditService.getContextFromRequest(req),
    });
    return created;
  }

  @Get('cashflow')
  getGlobalCashflow(@Req() req: { user: AuthUser }) {
    if (!hasAccess(req.user, 'financialAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso ao financeiro.');
    }

    return this.service.getGlobalCashflow();
  }

  @Patch(':transactionId/settle')
  async settleGlobalTransaction(
    @Req() req: any,
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    if (!hasAccess(req.user, 'financialAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar movimentações.',
      );
    }

    const settled = await this.service.settleTransaction(transactionId);
    await this.auditService.log({
      module: 'financial',
      action: 'settle',
      entityType: 'financial_transaction',
      entityId: transactionId,
      afterData: settled,
      eventId: settled.eventId ?? null,
      ...this.auditService.getContextFromRequest(req),
    });
    return settled;
  }

  @Patch(':transactionId')
  async updateGlobalTransaction(
    @Req() req: any,
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Body() body: UpdateTransactionDto,
  ) {
    this.ensureAdmin(req.user);

    const beforeData = await this.service.getById(transactionId);
    const updated = await this.service.update(transactionId, body);
    await this.auditService.log({
      module: 'financial',
      action: 'update',
      entityType: 'financial_transaction',
      entityId: transactionId,
      beforeData,
      afterData: updated,
      eventId: updated.eventId ?? null,
      ...this.auditService.getContextFromRequest(req),
    });
    return updated;
  }

  @Delete(':transactionId')
  async deleteGlobalTransaction(
    @Req() req: any,
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    this.ensureAdmin(req.user);

    const beforeData = await this.service.getById(transactionId);
    const removed = await this.service.remove(transactionId);
    await this.auditService.log({
      module: 'financial',
      action: 'delete',
      entityType: 'financial_transaction',
      entityId: transactionId,
      beforeData,
      afterData: removed,
      eventId: beforeData.eventId ?? null,
      ...this.auditService.getContextFromRequest(req),
    });
    return removed;
  }

  @Get('event/:eventId')
  listByEvent(
    @Req() req: { user: AuthUser },
    @Param('eventId', ParseIntPipe) eventId: number,
    @Query('search') search?: string,
    @Query('type') type?: 'income' | 'expense',
    @Query('status') status?: 'planned' | 'settled',
    @Query('categoryId') categoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (!hasAccess(req.user, 'financialAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso ao financeiro.');
    }

    return this.service.listAll({
      eventId,
      search,
      type,
      status,
      categoryId: categoryId ? Number(categoryId) : undefined,
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Post('event/:eventId')
  async createByEvent(
    @Req() req: any,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() body: Omit<CreateTransactionDto, 'eventId'>,
  ) {
    if (!hasAccess(req.user, 'financialAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para criar movimentações.',
      );
    }

    const created = await this.service.create({ ...body, eventId });
    await this.auditService.log({
      module: 'financial',
      action: 'create',
      entityType: 'financial_transaction',
      entityId: created.id,
      eventId,
      afterData: created,
      ...this.auditService.getContextFromRequest(req),
    });
    return created;
  }

  @Get('event/:eventId/cashflow')
  getEventCashflow(
    @Req() req: { user: AuthUser },
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    if (!hasAccess(req.user, 'financialAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso ao financeiro.');
    }

    return this.service.getEventCashflow(eventId);
  }

  @Patch('event/:eventId/:transactionId/settle')
  async settleEventTransaction(
    @Req() req: any,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    if (!hasAccess(req.user, 'financialAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar movimentações.',
      );
    }

    const settled = await this.service.settleEventTransaction(eventId, transactionId);
    await this.auditService.log({
      module: 'financial',
      action: 'settle',
      entityType: 'financial_transaction',
      entityId: transactionId,
      eventId,
      afterData: settled,
      ...this.auditService.getContextFromRequest(req),
    });
    return settled;
  }

  @Patch('event/:eventId/:transactionId')
  async updateEventTransaction(
    @Req() req: any,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Body() body: UpdateTransactionDto,
  ) {
    this.ensureAdmin(req.user);

    const beforeData = await this.service.getById(transactionId, eventId);
    const updated = await this.service.update(transactionId, body, eventId);
    await this.auditService.log({
      module: 'financial',
      action: 'update',
      entityType: 'financial_transaction',
      entityId: transactionId,
      beforeData,
      afterData: updated,
      eventId,
      ...this.auditService.getContextFromRequest(req),
    });
    return updated;
  }

  @Delete('event/:eventId/:transactionId')
  async deleteEventTransaction(
    @Req() req: any,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    this.ensureAdmin(req.user);

    const beforeData = await this.service.getById(transactionId, eventId);
    const removed = await this.service.remove(transactionId, eventId);
    await this.auditService.log({
      module: 'financial',
      action: 'delete',
      entityType: 'financial_transaction',
      entityId: transactionId,
      beforeData,
      afterData: removed,
      eventId,
      ...this.auditService.getContextFromRequest(req),
    });
    return removed;
  }
}
