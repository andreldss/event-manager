import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, PrismaService, JwtStrategy],
    exports: [JwtModule],
})
export class AuthModule { }
