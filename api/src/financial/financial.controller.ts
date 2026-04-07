import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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

  @Get(':eventId')
  list(
    @Req() req: { user: AuthUser },
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    if (!hasAccess(req.user, 'financialAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso ao financeiro.');
    }

    return this.service.list(eventId);
  }

  @Post(':eventId')
  create(
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

  @Get(':eventId/cashflow')
  getCashflow(
    @Req() req: { user: AuthUser },
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    if (!hasAccess(req.user, 'financialAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso ao financeiro.');
    }

    return this.service.getEventCashflow(eventId);
  }

  @Patch(':eventId/:transactionId/settle')
  settleTransaction(
    @Req() req: { user: AuthUser },
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    if (!hasAccess(req.user, 'financialAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar movimentações.',
      );
    }

    return this.service.settleTransaction(eventId, transactionId);
  }
}
