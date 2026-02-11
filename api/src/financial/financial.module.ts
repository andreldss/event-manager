import { Module } from '@nestjs/common';
import { FinancialController } from './financial.controller.js';
import { FinancialService } from './financial.service.js';
import { FinancialCategoryModule } from './category/financial-category.module.js';

@Module({
  controllers: [FinancialController],
  providers: [FinancialService],
  imports: [FinancialCategoryModule]
})
export class FinancialModule {}
