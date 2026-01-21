import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateEventDto } from './dto/event.dto.js';
import { EventsService } from './events.service.js';

@Controller('events')
export class EventsController {
    constructor(private eventService: EventsService) { }

    @Post('create')
    create(@Body() body: CreateEventDto) {
        return this.eventService.create(body)
    }

    @Get()
    findAll() {
        return this.eventService.getAll();
    }
}
