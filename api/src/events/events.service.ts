import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateEventDto } from './dto/event.dto.js';

@Injectable()
export class EventsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateEventDto) {
        const name = dto.name?.trim();

        if (!name || !dto.type || !dto.date || !dto.location || !dto.clientId) {
            throw new BadRequestException('Campos devem ser preenchidos.');
        }

        if (!dto.type || (dto.type !== 'simple' && dto.type !== 'collective')) {
            throw new BadRequestException('Tipo de evento inválido.');
        }

        const eventDate = new Date(dto.date + 'T00:00:00');
        const today = new Date(new Date().toDateString());

        if (eventDate < today) {
            throw new BadRequestException('Data inválida');
        }

        const numberClientId = Number(dto.clientId)

        const client = await this.prisma.client.findUnique({
            where: { id: numberClientId },
        });

        if (!client) {
            throw new BadRequestException('Cliente não encontrado');
        }

        return this.prisma.event.create({
            data: {
                name: name,
                type: dto.type,
                date: eventDate,
                location: dto.location,
                notes: dto.notes,
                clientId: numberClientId
            },
        });
    }

    async getAll() {
        return this.prisma.event.findMany({
            orderBy: { createdAt: "desc" },
        });
    }

    async getById(id: number) {

        const idNumber = Number(id);

        if (Number.isNaN(idNumber)) {
            throw new BadRequestException("ID inválido.");
        }

        return this.prisma.event.findUnique({
            where: { id: idNumber },
            include: {
                client: {
                    select: {
                        name: true,
                    },
                },
            }
        });
    }

    async addParticipant(eventId: number, name: string) {
        const eventIdNumber = Number(eventId);

        if (Number.isNaN(eventIdNumber)) {
            throw new BadRequestException("ID do evento inválido.");
        }

        const event = await this.prisma.event.findUnique({
            where: { id: eventIdNumber },
        });

        if (!event) {
            throw new BadRequestException("Evento não encontrado.");
        }

        const nameTrim = name.trim();
        if (!nameTrim) {
            throw new BadRequestException("Nome inválido.");
        }

        return this.prisma.participant.create({
            data: {
                eventId: eventIdNumber,
                name: nameTrim,
            },
        });
    }

    async upsertCollectionPayment(eventId: number, participantId: number, referenceMonth: string, amount: number) {

        const eventIdNumber = Number(eventId);

        if (Number.isNaN(eventIdNumber)) {
            throw new BadRequestException("ID do evento inválido.");
        }

        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(referenceMonth)) {
            throw new BadRequestException('referenceMonth inválido');
        }

        if (typeof amount !== 'number' || Number.isNaN(amount) || amount < 0) {
            throw new BadRequestException('amount inválido');
        }

        const participant = await this.prisma.participant.findFirst({
            where: { id: participantId, eventId: eventIdNumber },
            select: { id: true, name: true },
        });

        if (!participant) {
            throw new BadRequestException('Participante não encontrado neste evento.');
        }

        return this.prisma.$transaction(async (tx) => {

            if (amount === 0) {

                const existing = await tx.collection.findUnique({
                    where: {
                        participantId_referenceMonth: {
                            participantId,
                            referenceMonth,
                        },
                    },
                    select: { id: true },
                });

                if (!existing) {
                    return { deleted: true };
                }

                await tx.financialTransaction.deleteMany({
                    where: {
                        sourceType: 'collection',
                        sourceId: existing.id,
                    },
                });

                await tx.collection.delete({
                    where: { id: existing.id },
                });

                return { deleted: true };
            }

            const collection = await tx.collection.upsert({
                where: {
                    participantId_referenceMonth: {
                        participantId,
                        referenceMonth,
                    },
                },
                create: {
                    participantId,
                    referenceMonth,
                    amount,
                },
                update: {
                    amount,
                },
            });

            await tx.financialTransaction.upsert({
                where: {
                    sourceType_sourceId: {
                        sourceType: 'collection',
                        sourceId: collection.id,
                    },
                },
                create: {
                    eventId: eventIdNumber,
                    type: 'income',
                    status: 'settled',
                    amount,
                    description: `Coleta - ${participant.name} (${referenceMonth})`,
                    paidAt: new Date(),
                    sourceType: 'collection',
                    sourceId: collection.id,
                },
                update: {
                    amount,
                    description: `Coleta - ${participant.name} (${referenceMonth})`,
                },
            });

            return collection;
        });
    }


    async getParticipants(eventId: number) {
        const eventIdNumber = Number(eventId);

        if (Number.isNaN(eventIdNumber)) {
            throw new BadRequestException("ID do evento inválido.");
        }

        return this.prisma.participant.findMany({
            where: { eventId: eventIdNumber },
            orderBy: { name: "asc" },
        });
    }

    async getCollections(eventId: number) {
        const eventIdNumber = Number(eventId);

        if (Number.isNaN(eventIdNumber)) {
            throw new BadRequestException("ID do evento inválido.");
        }

        const collections = await this.prisma.collection.findMany({
            where: {
                participant: {
                    eventId: eventIdNumber,
                },
            },
            select: {
                participantId: true,
                referenceMonth: true,
                amount: true,
            },
        });

        return collections.map(c => ({
            participantId: c.participantId,
            referenceMonth: c.referenceMonth, 
            amount: Number(c.amount),
        }));
    }

    async getEventPaymentsMonths(eventId: number) {
        const eventIdNumber = Number(eventId);

        if (Number.isNaN(eventIdNumber)) {
            throw new BadRequestException("ID do evento inválido.");
        }
        
        const months = await this.prisma.eventPaymentMonth.findMany({
            where: {
                eventId: eventIdNumber,
            },
            select: {
                month: true,
            },
        });

        return months.map(m => m.month);
    }

    async createEventPaymentMonths(eventId: number, startMonth: string, termMonths: number) {
        const eventIdNumber = Number(eventId);
        if (Number.isNaN(eventIdNumber)) throw new BadRequestException("ID do evento inválido.");

        const start = (startMonth || '').trim();
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(start)) {
            throw new BadRequestException('startMonth inválido (use YYYY-MM).');
        }

        const term = Number(termMonths);
        if (![12, 24, 36].includes(term)) {
            throw new BadRequestException('termMonths inválido (use 12, 24 ou 36).');
        }

        const [yStr, mStr] = start.split('-');
        const y0 = Number(yStr);
        const m0 = Number(mStr);

        const months = Array.from({ length: term }, (_, i) => {
            const total = (m0 - 1) + i;
            const y = y0 + Math.floor(total / 12);
            const m = (total % 12) + 1;
            return `${y}-${String(m).padStart(2, '0')}`;
        });

        await this.prisma.eventPaymentMonth.createMany({
            data: months.map(month => ({ eventId: eventIdNumber, month })),
            skipDuplicates: true,
        });

        const saved = await this.prisma.eventPaymentMonth.findMany({
            where: { eventId: eventIdNumber },
            select: { month: true },
            orderBy: { month: 'asc' },
        });

        return saved.map(m => m.month);
    }

    async createEventChecklist(eventId: number, text: string, date: string) {
        const eventIdNumber = Number(eventId);
        if (Number.isNaN(eventIdNumber)) throw new BadRequestException("ID do evento inválido.");

        const textTrim = text.trim();
        if (!textTrim) throw new BadRequestException("Texto do item é obrigatório.");

        return this.prisma.eventChecklist.create({
            data: {
                eventId: eventIdNumber,
                text: textTrim,
                date: date ? new Date(date + 'T00:00:00') : null,
            },
        });
    }

    async listEventChecklist(eventId: number) {
        const eventIdNumber = Number(eventId);
        if (Number.isNaN(eventIdNumber)) throw new BadRequestException("ID do evento inválido.");   

        return this.prisma.eventChecklist.findMany({
            where: { eventId: eventIdNumber },
            orderBy: { createdAt: 'asc' },
        });
    }

    async deleteEventChecklistItem(id: number) {
        const idNumber = Number(id);
        if (Number.isNaN(idNumber)) throw new BadRequestException("ID do item de checklist inválido.");

        return this.prisma.eventChecklist.delete({
            where: { id: idNumber },
        });
    }

    async doneEventChecklistItem(id: number) {
        const idNumber = Number(id);
        if (Number.isNaN(idNumber)) throw new BadRequestException("ID do item de checklist inválido.");

        const item = await this.prisma.eventChecklist.findUnique({
            where: { id: idNumber },
            select: { id: true, done: true },
        });

        if (!item) {
            throw new BadRequestException("Item de checklist não encontrado.");
        }

        return this.prisma.eventChecklist.update({
            where: { id: idNumber },
            data: { done: !item.done },
        });
    }
}
