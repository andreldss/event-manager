import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { hasAccess } from '../common/auth/has-access.js';
import type { AuthUser } from '../common/types/auth-user.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  }

  private endOfMonth(date: Date) {
    return new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
  }

  private startOfDay(date: Date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0,
    );
  }

  private getLastMonths(count: number) {
    const now = new Date();
    const months: { label: string; start: Date; end: Date }[] = [];

    for (let i = count - 1; i >= 0; i--) {
      const base = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(
        base.getFullYear(),
        base.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );
      const end = new Date(
        base.getFullYear(),
        base.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const label = base.toLocaleDateString('pt-BR', {
        month: 'short',
      });

      months.push({
        label: label.charAt(0).toUpperCase() + label.slice(1).replace('.', ''),
        start,
        end,
      });
    }

    return months;
  }

  async getSummary(user: AuthUser) {
    const canViewFinancial = hasAccess(user, 'financialAccess', 'view');
    const canViewEvents = hasAccess(user, 'eventsAccess', 'view');

    const now = new Date();
    const monthStart = this.startOfMonth(now);
    const monthEnd = this.endOfMonth(now);
    const todayStart = this.startOfDay(now);

    let monthSummary: {
      income: number;
      expense: number;
      balance: number;
      eventsCount: number | null;
    } | null = null;

    let monthlyChart: { month: string; income: number; expense: number }[] = [];
    let upcomingEvents: {
      id: number;
      name: string;
      date: string | null;
      clientName: string | null;
      location: string | null;
    }[] = [];
    let recentEvents: {
      id: number;
      name: string;
      createdAt: string;
      clientName: string | null;
    }[] = [];

    if (canViewFinancial) {
      const monthTransactions = await this.prisma.financialTransaction.findMany(
        {
          where: {
            status: 'settled',
            paidAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          select: {
            type: true,
            amount: true,
          },
        },
      );

      const income = monthTransactions
        .filter((item) => item.type === 'income')
        .reduce((sum, item) => sum + Number(item.amount), 0);

      const expense = monthTransactions
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + Number(item.amount), 0);

      let eventsCount: number | null = null;

      if (canViewEvents) {
        eventsCount = await this.prisma.event.count({
          where: {
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        });
      }

      monthSummary = {
        income,
        expense,
        balance: income - expense,
        eventsCount,
      };

      const months = this.getLastMonths(6);

      const monthlyChartData = await Promise.all(
        months.map(async (month) => {
          const transactions = await this.prisma.financialTransaction.findMany({
            where: {
              status: 'settled',
              paidAt: {
                gte: month.start,
                lte: month.end,
              },
            },
            select: {
              type: true,
              amount: true,
            },
          });

          const monthIncome = transactions
            .filter((item) => item.type === 'income')
            .reduce((sum, item) => sum + Number(item.amount), 0);

          const monthExpense = transactions
            .filter((item) => item.type === 'expense')
            .reduce((sum, item) => sum + Number(item.amount), 0);

          return {
            month: month.label,
            income: monthIncome,
            expense: monthExpense,
          };
        }),
      );

      monthlyChart = monthlyChartData;
    } else if (canViewEvents) {
      const eventsCount = await this.prisma.event.count({
        where: {
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      monthSummary = {
        income: 0,
        expense: 0,
        balance: 0,
        eventsCount,
      };
    }

    if (canViewEvents) {
      const nextEvents = await this.prisma.event.findMany({
        where: {
          date: {
            gte: todayStart,
          },
        },
        orderBy: {
          date: 'asc',
        },
        take: 5,
        select: {
          id: true,
          name: true,
          date: true,
          location: true,
          client: {
            select: {
              name: true,
            },
          },
        },
      });

      upcomingEvents = nextEvents.map((event) => ({
        id: event.id,
        name: event.name,
        date: event.date ? event.date.toISOString() : null,
        clientName: event.client?.name ?? null,
        location: event.location ?? null,
      }));

      const latestEvents = await this.prisma.event.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          name: true,
          createdAt: true,
          client: {
            select: {
              name: true,
            },
          },
        },
      });

      recentEvents = latestEvents.map((event) => ({
        id: event.id,
        name: event.name,
        createdAt: event.createdAt.toISOString(),
        clientName: event.client?.name ?? null,
      }));
    }

    return {
      permissions: {
        canViewFinancial,
        canViewEvents,
      },
      monthSummary,
      monthlyChart,
      upcomingEvents,
      recentEvents,
    };
  }
}
