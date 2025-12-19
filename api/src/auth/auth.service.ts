import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { userAuthDto } from './dto/userAuth.dto.js';

@Injectable()
export class AuthService {
    constructor(private prismaService: PrismaService) {}

    async register(data: userAuthDto) {
        const user = await this.prismaService.user.create({
            data: {
                email: data.email,
                password: data.password,
                name: data.name,
            },
        });  

        return user;
    }
}
