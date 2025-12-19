import { Body, Controller, Post } from '@nestjs/common';
import { userAuthDto } from './dto/userAuth.dto.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}

    @Post('register')
    register(@Body() body: userAuthDto) {
        return this.authService.register(body)
    }
}
