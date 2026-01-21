import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ClientsService } from './clients.service.js';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto.js';

@Controller('clients')
export class ClientsController {

    constructor(private clientService: ClientsService) { }

    @Post('new')
    register(@Body() body: CreateClientDto) {
        return this.clientService.create(body)
    }

    @Get()
    findAll() {
        return this.clientService.getAll();
    }

    @Get('count')
    count() {
        return this.clientService.getCount();
    }

    @Get(':id')
    findOne(@Param("id") id: number) {
        return this.clientService.getOne(id);
    }

    @Patch(':id')
    update(@Param("id") id: number, @Body() body: UpdateClientDto) {
        return this.clientService.update(id, body);
    }

    @Delete(':id')
    delete(@Param("id") id: number) {
        return this.clientService.delete(id);
    }

}
