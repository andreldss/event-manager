import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTransactionDto } from './dto/financial.dto.js';

type CashflowPoint = {
  date: string;
  income: number;
  expense: number;
};

type ListFinancialFilters = {
  eventId?: number;
  search?: string;
};

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  private parseId(value: number, label = 'ID') {
    const id = Number(value);

    if (Number.isNaN(id)) {
      throw new BadRequestException(`${label} inválido.`);
    }

    return id;
  }

  async listByEvent(eventId: number) {
    const eventIdNumber = this.parseId(eventId, 'ID do evento');

    return this.prisma.financialTransaction.findMany({
      where: {
        eventId: eventIdNumber,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async listAll(filters?: ListFinancialFilters) {
    const where: any = {};

    if (filters?.eventId) {
      where.eventId = this.parseId(filters.eventId, 'ID do evento');
    }

    if (filters?.search?.trim()) {
      const term = filters.search.trim();

      where.OR = [
        {
          description: {
            contains: term,
          },
        },
        {
          category: {
            name: {
              contains: term,
            },
          },
        },
        {
          event: {
            name: {
              contains: term,
            },
          },
        },
      ];
    }

    return this.prisma.financialTransaction.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(body: CreateTransactionDto) {
    const eventIdNumber = this.parseId(body.eventId, 'ID do evento');

    const event = await this.prisma.event.findUnique({
      where: { id: eventIdNumber },
      select: { id: true },
    });

    if (!event) {
      throw new BadRequestException('Evento não encontrado.');
    }

    const description = (body.description || '').trim();

    if (!description) {
      throw new BadRequestException('Descrição obrigatória.');
    }

    const amount = Number(body.amount);

    if (Number.isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Valor inválido.');
    }

    if (body.type !== 'income' && body.type !== 'expense') {
      throw new BadRequestException('Tipo inválido.');
    }

    let categoryId: number | null = null;

    if (body.categoryId !== null && body.categoryId !== undefined) {
      const category = await this.prisma.financialCategory.findUnique({
        where: { id: body.categoryId },
        select: { id: true },
      });

      if (!category) {
        throw new BadRequestException('Categoria inválida.');
      }

      categoryId = body.categoryId;
    }

    const status = body.status === 'settled' ? 'settled' : 'planned';

    let paidAt: Date | null = null;

    if (status === 'settled') {
      paidAt = body.paidAt ? new Date(body.paidAt) : new Date();
    }

    return this.prisma.financialTransaction.create({
      data: {
        eventId: eventIdNumber,
        type: body.type,
        description,
        amount,
        status,
        paidAt,
        categoryId,
        sourceType: 'manual',
        sourceId: null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getEventCashflow(eventId: number) {
    const eventIdNumber = this.parseId(eventId, 'ID do evento');

    return this.buildCashflow({
      eventId: eventIdNumber,
    });
  }

  async getGlobalCashflow() {
    return this.buildCashflow({});
  }

  private async buildCashflow(where: { eventId?: number }) {
    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        ...where,
        status: 'settled',
        paidAt: { not: null },
      },
      select: {
        type: true,
        amount: true,
        paidAt: true,
      },
      orderBy: {
        paidAt: 'asc',
      },
    });

    const map = new Map<string, CashflowPoint>();

    for (const item of transactions) {
      const date = item.paidAt!.toISOString().slice(0, 10);

      if (!map.has(date)) {
        map.set(date, {
          date,
          income: 0,
          expense: 0,
        });
      }

      const entry = map.get(date)!;

      if (item.type === 'income') {
        entry.income += Number(item.amount);
      } else {
        entry.expense += Number(item.amount);
      }
    }

    return Array.from(map.values());
  }

  async settleTransaction(transactionId: number) {
    const transactionIdNumber = this.parseId(
      transactionId,
      'ID da movimentação',
    );

    const transaction = await this.prisma.financialTransaction.findUnique({
      where: {
        id: transactionIdNumber,
      },
    });

    if (!transaction) {
      throw new BadRequestException('Movimentação não encontrada.');
    }

    if (transaction.type !== 'expense') {
      throw new BadRequestException(
        'Apenas saídas podem ser marcadas como pagas.',
      );
    }

    if (transaction.status === 'settled') {
      return transaction;
    }

    return this.prisma.financialTransaction.update({
      where: {
        id: transactionIdNumber,
      },
      data: {
        status: 'settled',
        paidAt: new Date(),
      },
    });
  }

  async settleEventTransaction(eventId: number, transactionId: number) {
    const eventIdNumber = this.parseId(eventId, 'ID do evento');
    const transactionIdNumber = this.parseId(
      transactionId,
      'ID da movimentação',
    );

    const transaction = await this.prisma.financialTransaction.findFirst({
      where: {
        id: transactionIdNumber,
        eventId: eventIdNumber,
      },
    });

    if (!transaction) {
      throw new BadRequestException('Movimentação não encontrada.');
    }

    return this.settleTransaction(transaction.id);
  }
}
