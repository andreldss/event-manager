import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { loginAuthDto, registerAuthDto } from './dto/userAuth.dto.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { Response } from 'express';
import { CurrentUser } from './decorator/current-user.decorator.js';

interface AuthUser {
    userId: number;
    email: string;
}

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) { }

    @Post('register')
    register(@Body() body: registerAuthDto) {
        return this.authService.register(body)
    }

    @Post('login')
    async login(@Body() body: loginAuthDto, @Res({ passthrough: true }) response: Response) {
        const { token } = await this.authService.login(body)

        response.cookie('access_token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return { message: 'Login realizado com sucesso' };
    }

    @Post('logout')
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('access_token', { path: '/' });
        return { ok: true };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@CurrentUser() user: AuthUser) {
        return user;
    }
}
