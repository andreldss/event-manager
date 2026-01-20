import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto.js';

@Injectable()
export class ClientsService {
    constructor(private prisma: PrismaService) { }

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

    async getAll() {
        return this.prisma.client.findMany({
            orderBy: { createdAt: "desc" },
        });
    }

    async getOne(id: number) {

        const idNumber = Number(id);

        if (Number.isNaN(idNumber)) {
            throw new BadRequestException("ID inválido.");
        }

        const client = await this.prisma.client.findUnique({ where: { id: idNumber } });
        if (!client) throw new NotFoundException("Cliente não cadastrado.");
        return client;
    }

    async getCount() {
        return this.prisma.client.count()
    }

    async update(id: number, dto: UpdateClientDto) {
        const idNumber = Number(id);

        if (Number.isNaN(idNumber)) {
            throw new BadRequestException("ID inválido.");
        }

        try {
            return await this.prisma.client.update({
                where: { id: idNumber },
                data: dto,
            });
        } catch (error) {
            throw new NotFoundException("Cliente não encontrado.");
        }
    }

}
