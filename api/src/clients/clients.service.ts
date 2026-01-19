import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service.js';
import { CreateClientDto } from './dto/client.dto.js';

@Injectable()
export class ClientsService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateClientDto) {
        const name = dto.name?.trim();

        if (!name) {
            throw new BadRequestException('Nome do cliente é obrigatório.');
        }

        return this.prisma.client.create({
            data: {
                name: name,
                phone: dto.phone,
                notes: dto.notes,
            },
        });
    }
}
