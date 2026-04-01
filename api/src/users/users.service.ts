import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async count() {
    return this.prisma.user.count();
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async create(body: CreateUserDto) {
    if (!body.name || typeof body.name !== 'string') {
      throw new BadRequestException('Nome inválido.');
    }

    if (!body.email || typeof body.email !== 'string') {
      throw new BadRequestException('Email inválido.');
    }

    if (!body.password || body.password.length < 6) {
      throw new BadRequestException('Senha deve ter pelo menos 6 caracteres.');
    }

    const email = body.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Já existe um usuário com este e-mail.');
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    return this.prisma.user.create({
      data: {
        name: body.name.trim(),
        email,
        password: hashedPassword,
        isAdmin: body.isAdmin,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
      },
    });
  }

  async update(id: number, body: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (body.name !== undefined && typeof body.name !== 'string') {
      throw new BadRequestException('Nome inválido.');
    }

    if (body.email !== undefined && typeof body.email !== 'string') {
      throw new BadRequestException('Email inválido.');
    }

    if (body.password !== undefined && body.password.length < 6) {
      throw new BadRequestException('Senha deve ter pelo menos 6 caracteres.');
    }

    if (body.email) {
      const email = body.email.trim().toLowerCase();

      const userWithSameEmail = await this.prisma.user.findFirst({
        where: {
          email,
          NOT: { id },
        },
      });

      if (userWithSameEmail) {
        throw new BadRequestException('Já existe um usuário com este e-mail.');
      }
    }

    let hashedPassword: string | undefined;

    if (body.password) {
      hashedPassword = await bcrypt.hash(body.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.email !== undefined
          ? { email: body.email.trim().toLowerCase() }
          : {}),
        ...(body.isAdmin !== undefined ? { isAdmin: body.isAdmin } : {}),
        ...(hashedPassword ? { password: hashedPassword } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
      },
    });
  }

  async remove(id: number) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Usuário removido com sucesso.' };
  }
}
