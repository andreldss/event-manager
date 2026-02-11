import { Module } from '@nestjs/common';
import { FinancialCategoryController } from './financial-category.controller.js';
import { FinancialCategoryService } from './financial-category.service.js';

@Module({
  controllers: [FinancialCategoryController],
  providers: [FinancialCategoryService]
})
export class FinancialCategoryModule {}
