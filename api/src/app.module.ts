import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ClientsModule } from './clients/clients.module.js';

@Module({
  imports: [PrismaModule, AuthModule, ClientsModule],
})
export class AppModule { }
