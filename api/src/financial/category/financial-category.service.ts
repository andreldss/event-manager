import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class FinancialCategoryService {

    constructor(private readonly prisma: PrismaService) { }

    async list() {
        return this.prisma.financialCategory.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async create(name: string) {
        const nameTrimmed = (name ?? '').trim();
        if (!nameTrimmed) throw new BadRequestException('Nome inválido.');

        try {
            return await this.prisma.financialCategory.create({
                data: { name: nameTrimmed },
            });
        } catch {
            throw new BadRequestException('Categoria já existe.');
        }
    }

    async update(id: number, name: string) {
        const idNumber = Number(id);

        if (Number.isNaN(idNumber)) {
            throw new BadRequestException("ID inválido.");
        }

        const nameTrimmed = (name ?? '').trim();
        if (!nameTrimmed) throw new BadRequestException('Nome inválido.');

        try {
            return await this.prisma.financialCategory.update({
                where: { id: idNumber },
                data: { name: nameTrimmed },
            });
        } catch {
            throw new BadRequestException('Não foi possível atualizar.');
        }
    }

    async remove(id: number) {
        const idNumber = Number(id);

        if (Number.isNaN(idNumber)) {
            throw new BadRequestException("ID inválido.");
        }

        try {
            return await this.prisma.financialCategory.delete({
                where: { id: idNumber },
            });
        } catch {
            throw new BadRequestException('Não foi possível remover.');
        }
    }

    async getById(id: number) {
        const idNumber = Number(id);

        if (Number.isNaN(idNumber)) {
            throw new BadRequestException("ID inválido.");
        }

        return this.prisma.financialCategory.findUnique({
            where: { id: idNumber },
        });
    }

    async getCount() {
        return this.prisma.financialCategory.count()
    }
}
