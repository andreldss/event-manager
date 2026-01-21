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
}
