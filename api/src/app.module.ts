import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { EventsModule } from './events/events.module.js';
import { FinancialModule } from './financial/financial.module.js';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [PrismaModule, AuthModule, ClientsModule, EventsModule, FinancialModule, StorageModule],
})
export class AppModule { }
