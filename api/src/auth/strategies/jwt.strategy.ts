import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service.js';

interface JwtPayload {
    sub: number;
    email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private prismaService: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req) => {
                    console.log('[cookies]', req?.cookies);
                    return req?.cookies?.access_token;
                },
            ]),
            secretOrKey: process.env.JWT_SECRET!,
            ignoreExpiration: false,
        });
    }

    async validate(payload: JwtPayload) {
        if (!payload?.sub) {
            throw new UnauthorizedException('Token inválido');
        }

        const user = await this.prismaService.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true },
        });

        if (!user) {
            throw new UnauthorizedException('Usuário não encontrado');
        }

        return {
            userId: user.id,
            email: user.email
        };
    }
}