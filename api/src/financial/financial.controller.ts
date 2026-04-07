import {
  Body,
  Controller,
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
import { hasAccess } from '../common/auth/has-access.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AuthUser } from 'src/common/types/auth-user.js';

@UseGuards(JwtAuthGuard)
@Controller('financial')
export class FinancialController {
  constructor(private readonly service: FinancialService) {}

  @Get()
  listAll(
    @Req() req: { user: AuthUser },
    @Query('eventId') eventId?: string,
    @Query('search') search?: string,
  ) {
    if (!hasAccess(req.user, 'financialAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso ao financeiro.');
    }

    return this.service.listAll({
      eventId: eventId ? Number(eventId) : undefined,
      search,
    });
  }

  @Post()
  createGlobal(
    @Req() req: { user: AuthUser },
    @Body() body: CreateTransactionDto,
  ) {
    if (!hasAccess(req.user, 'financialAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para criar movimentações.',
      );
    }

    return this.service.create(body);
  }

  @Get('cashflow')
  getGlobalCashflow(@Req() req: { user: AuthUser }) {
    if (!hasAccess(req.user, 'financialAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso ao financeiro.');
    }

    return this.service.getGlobalCashflow();
  }

  @Patch(':transactionId/settle')
  settleGlobalTransaction(
    @Req() req: { user: AuthUser },
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    if (!hasAccess(req.user, 'financialAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar movimentações.',
      );
    }

    return this.service.settleTransaction(transactionId);
  }

  @Get('event/:eventId')
  listByEvent(
    @Req() req: { user: AuthUser },
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    if (!hasAccess(req.user, 'financialAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso ao financeiro.');
    }

    return this.service.listByEvent(eventId);
  }

  @Post('event/:eventId')
  createByEvent(
    @Req() req: { user: AuthUser },
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() body: Omit<CreateTransactionDto, 'eventId'>,
  ) {
    if (!hasAccess(req.user, 'financialAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para criar movimentações.',
      );
    }

    return this.service.create({ ...body, eventId });
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
  settleEventTransaction(
    @Req() req: { user: AuthUser },
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    if (!hasAccess(req.user, 'financialAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar movimentações.',
      );
    }

    return this.service.settleEventTransaction(eventId, transactionId);
  }
}
