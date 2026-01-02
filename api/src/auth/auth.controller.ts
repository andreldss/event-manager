import { Body, Controller, Post } from '@nestjs/common';
import { loginAuthDto, registerAuthDto } from './dto/userAuth.dto.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) { }

    @Post('register')
    register(@Body() body: registerAuthDto) {
        return this.authService.register(body)
    }

    @Post('login')
    login(@Body() body: loginAuthDto) {
        return this.authService.login(body)
    }
}
