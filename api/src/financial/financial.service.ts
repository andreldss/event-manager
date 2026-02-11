import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTransactionDto } from './dto/financial.dto.js';

type CashflowPoint = {
    date: string;
    income: number;
    expense: number;
};

@Injectable()
export class FinancialService {

    constructor(private readonly prisma: PrismaService) { }

    async list(eventId: number) {
        const idNumber = Number(eventId);
                
        if (Number.isNaN(idNumber)) {
            throw new BadRequestException("ID inválido.");
        }

        return this.prisma.financialTransaction.findMany({
            where: { eventId: idNumber },
            include: {
                category: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(body: CreateTransactionDto) {

        const eventIdNumber = Number(body.eventId);

        if (Number.isNaN(eventIdNumber)) {
            throw new BadRequestException("ID inválido.");
        }

        const event = await this.prisma.event.findUnique({
            where: { id: eventIdNumber },
            select: { id: true },
        });

        if (!event) {
            throw new BadRequestException("Evento não encontrado.");
        }

        const description = (body.description || '').trim();

        if (!description) {
            throw new BadRequestException("Descrição obrigatória.");
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
                throw new BadRequestException("Categoria inválida.");
            }

            categoryId = body.categoryId;
        }

        const status = body.status === 'settled' ? 'settled' : 'planned';
        const paidAt = body.paidAt ? new Date(body.paidAt) : new Date();

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
        });
    } 

    async getEventCashflow(eventId: number) {
        const eventIdNumber = Number(eventId);

        if (Number.isNaN(eventIdNumber)) throw new BadRequestException("ID do evento inválido.");

        const collections = await this.prisma.financialTransaction.findMany({
            where: {
                eventId: eventIdNumber,
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

        for (const item of collections) {
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
}
