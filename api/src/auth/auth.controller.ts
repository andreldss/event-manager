import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { loginAuthDto, registerAuthDto } from './dto/userAuth.dto.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { Response } from 'express';
import { CurrentUser } from './decorator/current-user.decorator.js';
import { AuditService } from '../audit/audit.service.js';

interface AuthUser {
    userId: number;
    email: string;
}

@Controller('auth')
export class AuthController {

    constructor(
        private authService: AuthService,
        private auditService: AuditService,
    ) { }

    @Post('register')
    async register(@Body() body: registerAuthDto) {
        const result = await this.authService.register(body)

        await this.auditService.log({
            module: 'auth',
            action: 'register',
            entityType: 'user',
            entityId: result.id,
            actorType: 'system',
            afterData: result,
            metadata: { email: body.email },
        });

        return result;
    }

    @Post('login')
    async login(@Body() body: loginAuthDto, @Req() req: any, @Res({ passthrough: true }) response: Response) {
        const { token } = await this.authService.login(body)
        const isProduction = process.env.NODE_ENV === 'production';

        response.cookie('access_token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        await this.auditService.log({
            module: 'auth',
            action: 'login',
            actorType: 'system',
            ip: req.ip ?? null,
            userAgent: req.headers?.['user-agent'] ?? null,
            metadata: { email: body.email },
        });

        return { message: 'Login realizado com sucesso' };
    }

    @Post('logout')
    async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
        res.clearCookie('access_token', { path: '/' });

        await this.auditService.log({
            module: 'auth',
            action: 'logout',
            ...this.auditService.getContextFromRequest(req),
        });

        return { ok: true };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@CurrentUser() user: AuthUser) {
        return user;
    }
}
