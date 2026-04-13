import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTransactionDto } from './dto/financial.dto.js';
import { UpdateTransactionDto } from './dto/update-financial.dto.js';

type CashflowPoint = {
  date: string;
  income: number;
  expense: number;
};

type ListFinancialFilters = {
  eventId?: number;
  search?: string;
  type?: 'income' | 'expense';
  status?: 'planned' | 'settled';
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
};

type FinancialSummary = {
  income: number;
  expense: number;
  plannedExpense: number;
  balance: number;
};

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  private parseId(value: number, label = 'ID') {
    const id = Number(value);

    if (Number.isNaN(id)) {
      throw new BadRequestException(`${label} invÃ¡lido.`);
    }

    return id;
  }

  async listByEvent(eventId: number) {
    const eventIdNumber = this.parseId(eventId, 'ID do evento');
    return this.listAll({ eventId: eventIdNumber });
  }

  async listAll(filters?: ListFinancialFilters) {
    const where = this.buildWhere(filters);
    const page = Math.max(1, filters?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters?.pageSize ?? 30));

    const [items, allMatchingItems, total] = await this.prisma.$transaction([
      this.prisma.financialTransaction.findMany({
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
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.financialTransaction.findMany({
        where,
        select: {
          type: true,
          status: true,
          amount: true,
        },
      }),
      this.prisma.financialTransaction.count({ where }),
    ]);

    return {
      items,
      summary: this.buildSummary(allMatchingItems),
      pagination: {
        page,
        pageSize,
        total,
        hasMore: page * pageSize < total,
      },
    };
  }

  private buildWhere(filters?: ListFinancialFilters) {
    const where: any = {};

    if (filters?.eventId) {
      where.eventId = this.parseId(filters.eventId, 'ID do evento');
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.categoryId) {
      where.categoryId = this.parseId(filters.categoryId, 'ID da categoria');
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
            is: {
              name: {
                contains: term,
              },
            },
          },
        },
        {
          event: {
            is: {
              name: {
                contains: term,
              },
            },
          },
        },
      ];
    }

    const startDate = filters?.startDate?.trim();
    const endDate = filters?.endDate?.trim();

    if (startDate || endDate) {
      const paidAtRange: Record<string, Date> = {};
      const createdAtRange: Record<string, Date> = {};

      if (startDate) {
        const start = new Date(`${startDate}T00:00:00.000Z`);
        paidAtRange.gte = start;
        createdAtRange.gte = start;
      }

      if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999Z`);
        paidAtRange.lte = end;
        createdAtRange.lte = end;
      }

      where.AND = [
        ...(where.AND ?? []),
        {
          OR: [
            {
              paidAt: {
                ...paidAtRange,
              },
            },
            {
              paidAt: null,
              createdAt: {
                ...createdAtRange,
              },
            },
          ],
        },
      ];
    }

    return where;
  }

  private buildSummary(
    items: Array<{
      type: 'income' | 'expense';
      status: 'planned' | 'settled';
      amount: unknown;
    }>,
  ): FinancialSummary {
    let income = 0;
    let expense = 0;
    let plannedExpense = 0;

    for (const item of items) {
      const amount = Number(item.amount ?? 0);

      if (item.type === 'income') {
        income += amount;
        continue;
      }

      if (item.status === 'planned') {
        plannedExpense += amount;
      } else {
        expense += amount;
      }
    }

    return {
      income,
      expense,
      plannedExpense,
      balance: income - expense,
    };
  }

  async create(body: CreateTransactionDto) {
    const eventIdNumber = this.parseId(body.eventId, 'ID do evento');

    const event = await this.prisma.event.findUnique({
      where: { id: eventIdNumber },
      select: { id: true },
    });

    if (!event) {
      throw new BadRequestException('Evento nÃ£o encontrado.');
    }

    const description = (body.description || '').trim();

    if (!description) {
      throw new BadRequestException('DescriÃ§Ã£o obrigatÃ³ria.');
    }

    const amount = Number(body.amount);

    if (Number.isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Valor invÃ¡lido.');
    }

    if (body.type !== 'income' && body.type !== 'expense') {
      throw new BadRequestException('Tipo invÃ¡lido.');
    }

    let categoryId: number | null = null;

    if (body.categoryId !== null && body.categoryId !== undefined) {
      const category = await this.prisma.financialCategory.findUnique({
        where: { id: body.categoryId },
        select: { id: true },
      });

      if (!category) {
        throw new BadRequestException('Categoria invÃ¡lida.');
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

  async update(
    transactionId: number,
    body: UpdateTransactionDto,
    scopedEventId?: number,
  ) {
    const transaction = await this.findTransactionOrThrow(
      transactionId,
      scopedEventId,
    );

    if (transaction.sourceType === 'collection' && transaction.sourceId) {
      const amount = Number(body.amount);

      if (Number.isNaN(amount) || amount <= 0) {
        throw new BadRequestException(
          'Movimentações de coleta só podem ter o valor ajustado para um número maior que zero.',
        );
      }

      return this.prisma.$transaction(async (tx) => {
        await tx.collection.update({
          where: { id: transaction.sourceId! },
          data: { amount },
        });

        return tx.financialTransaction.update({
          where: { id: transaction.id },
          data: { amount },
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
      });
    }

    const eventIdNumber = this.parseId(
      body.eventId ?? transaction.eventId,
      'ID do evento',
    );

    const event = await this.prisma.event.findUnique({
      where: { id: eventIdNumber },
      select: { id: true },
    });

    if (!event) {
      throw new BadRequestException('Evento não encontrado.');
    }

    const description = (body.description ?? transaction.description ?? '').trim();

    if (!description) {
      throw new BadRequestException('Descrição obrigatória.');
    }

    const amount = Number(body.amount ?? transaction.amount);

    if (Number.isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Valor inválido.');
    }

    const type = body.type ?? transaction.type;

    if (type !== 'income' && type !== 'expense') {
      throw new BadRequestException('Tipo inválido.');
    }

    const status = body.status ?? transaction.status;

    let categoryId: number | null = transaction.categoryId ?? null;

    if (body.categoryId !== undefined) {
      if (body.categoryId === null) {
        categoryId = null;
      } else {
        const category = await this.prisma.financialCategory.findUnique({
          where: { id: body.categoryId },
          select: { id: true },
        });

        if (!category) {
          throw new BadRequestException('Categoria inválida.');
        }

        categoryId = body.categoryId;
      }
    }

    let paidAt: Date | null = transaction.paidAt;

    if (status === 'settled') {
      paidAt = body.paidAt ? new Date(body.paidAt) : transaction.paidAt ?? new Date();
    } else {
      paidAt = null;
    }

    return this.prisma.financialTransaction.update({
      where: { id: transaction.id },
      data: {
        eventId: eventIdNumber,
        type,
        status,
        description,
        amount,
        categoryId,
        paidAt,
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

  async remove(transactionId: number, scopedEventId?: number) {
    const transaction = await this.findTransactionOrThrow(
      transactionId,
      scopedEventId,
    );

    if (transaction.sourceType === 'collection' && transaction.sourceId) {
      await this.prisma.$transaction(async (tx) => {
        await tx.financialTransaction.deleteMany({
          where: {
            sourceType: 'collection',
            sourceId: transaction.sourceId,
          },
        });

        await tx.collection.delete({
          where: { id: transaction.sourceId! },
        });
      });

      return transaction;
    }

    return this.prisma.financialTransaction.delete({
      where: { id: transaction.id },
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
      'ID da movimentaÃ§Ã£o',
    );

    const transaction = await this.prisma.financialTransaction.findUnique({
      where: {
        id: transactionIdNumber,
      },
    });

    if (!transaction) {
      throw new BadRequestException('MovimentaÃ§Ã£o nÃ£o encontrada.');
    }

    if (transaction.type !== 'expense') {
      throw new BadRequestException(
        'Apenas saÃ­das podem ser marcadas como pagas.',
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
      'ID da movimentaÃ§Ã£o',
    );

    const transaction = await this.prisma.financialTransaction.findFirst({
      where: {
        id: transactionIdNumber,
        eventId: eventIdNumber,
      },
    });

    if (!transaction) {
      throw new BadRequestException('MovimentaÃ§Ã£o nÃ£o encontrada.');
    }

    return this.settleTransaction(transaction.id);
  }

  async getById(transactionId: number, scopedEventId?: number) {
    return this.findTransactionOrThrow(transactionId, scopedEventId);
  }

  private async findTransactionOrThrow(transactionId: number, scopedEventId?: number) {
    const transactionIdNumber = this.parseId(
      transactionId,
      'ID da movimentação',
    );

    const transaction = await this.prisma.financialTransaction.findFirst({
      where: {
        id: transactionIdNumber,
        ...(scopedEventId ? { eventId: this.parseId(scopedEventId, 'ID do evento') } : {}),
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

    if (!transaction) {
      throw new BadRequestException('Movimentação não encontrada.');
    }

    return transaction;
  }
}
