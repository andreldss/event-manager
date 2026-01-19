import { Body, Controller, Get, Post } from '@nestjs/common';
import { ClientsService } from './clients.service.js';
import { CreateClientDto } from './dto/client.dto.js';

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

}
