import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateFinancialCategoryDto } from './dto/category.dto.js';
import { FinancialCategoryService } from './financial-category.service.js';

@Controller('financial-category')
export class FinancialCategoryController {

    constructor(private readonly service: FinancialCategoryService) { }

    @Get()
    list() {
        return this.service.list();
    }

    @Post()
    create(@Body() body: CreateFinancialCategoryDto) {
        return this.service.create(body.name);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: CreateFinancialCategoryDto) {
        return this.service.update(Number(id), body.name);
    }

    @Get('count')
    count() {
        return this.service.getCount();
    }

    @Get(':id')
    getById(@Param('id') id: string) {
        return this.service.getById(Number(id));
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(Number(id));
    }

}
