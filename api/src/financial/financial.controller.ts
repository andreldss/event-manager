import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { FinancialService } from './financial.service.js';
import { CreateTransactionDto } from './dto/financial.dto.js';

@Controller('financial')
export class FinancialController {
  constructor(private readonly service: FinancialService) {}

  @Get(':eventId')
  list(@Param('eventId') eventId: number) {
    return this.service.list(eventId);
  }

  @Post(':eventId')
  create(
    @Param('eventId') eventId: number,
    @Body() body: Omit<CreateTransactionDto, 'eventId'>,
  ) {
    return this.service.create({ ...body, eventId });
  }

  @Get(':eventId/cashflow')
  getCashflow(@Param('eventId') eventId: number) {
    return this.service.getEventCashflow(eventId);
  }

  @Patch(':eventId/:transactionId/settle')
  settleTransaction(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    return this.service.settleTransaction(eventId, transactionId);
  }
}
