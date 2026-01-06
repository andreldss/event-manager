import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { loginAuthDto, registerAuthDto } from './dto/userAuth.dto.js';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../../generated/prisma/client.js';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private prismaService: PrismaService, private jwtService: JwtService) { }

    async register(data: registerAuthDto) {

        if (!data.name || !data.email || !data.password) {
            throw new BadRequestException('Nome, email e senha são obrigatórios.');
        }

        if (data.password.length < 6) {
            throw new BadRequestException('Senha deve ter no minímo 6 caracteres.');
        }

        if (data.password !== data.confirmPassword) {
            throw new BadRequestException('Senhas devem ser iguais.');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        try {
            const user = await this.prismaService.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    name: data.name,
                },
            });

            return {
                id: user.id,
                email: user.email,
                name: user.name,
            };

        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException('Email já cadastrado.');
                }
            }

            throw new InternalServerErrorException('Erro interno ao registrar usuário.',);
        }
    }

    async login(data: loginAuthDto) {
        if (!data.email || !data.password) {
            throw new BadRequestException('Nome, email e senha são obrigatórios.');
        }

        try {
            const user = await this.prismaService.user.findUnique({
                where: { email: data.email },
            });

            if (!user) {
                throw new UnauthorizedException('Credenciais inválidas');
            }

            const passwordMatch = await bcrypt.compare(data.password, user.password);
            if (!passwordMatch) {
                throw new UnauthorizedException('Credenciais inválidas');
            }

            const payload = { sub: user.id, email: user.email };

            const token = this.jwtService.sign(payload);

            return { token };

        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            throw new InternalServerErrorException('Erro interno ao fazer login.');
        }
    }
}
