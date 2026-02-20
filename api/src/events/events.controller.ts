import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { CreateEventDto } from './dto/event.dto.js';
import { CreateParticipantDto } from './dto/participant.dto.js';
import { EventsService } from './events.service.js';
import { UpsertCollectionDto } from './dto/collection.dto.js';
import { CreatePaymentMonthDto } from './dto/paymentmonth.js';
import { CreateChecklistItemDto } from './dto/checklist.js';
import { CreateGroupItemDto } from './dto/group.js';

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

    @Get(':id')
    getById(@Param("id") id: number) {
        return this.eventService.getById(id);
    }

    @Post('participants')
    addParticipant(@Body() body: CreateParticipantDto) {
        return this.eventService.addParticipant(body.eventId, body.name);
    }

    @Get(':eventId/participants')
    getParticipants(@Param('eventId') eventId: number) {
        return this.eventService.getParticipants(eventId);
    }

    @Put(':eventId/collections')
    upsertCollection(@Param('eventId') eventId: number, @Body() body: UpsertCollectionDto) {
        return this.eventService.upsertCollectionPayment(
            eventId,
            body.participantId,
            body.referenceMonth,
            body.amount,
        );
    }

    @Get(':eventId/collections')
    getCollections(@Param('eventId') eventId: number) {
        return this.eventService.getCollections(eventId);
    }

    @Get(':eventId/event_payment_months')
    getEventPaymentMonths(@Param('eventId') eventId: number) {
        return this.eventService.getEventPaymentsMonths(eventId);
    }

    @Post(':eventId/event_payment_months')
    addEventPaymentMonth(@Param('eventId') eventId: number, @Body() body: CreatePaymentMonthDto) {
        return this.eventService.createEventPaymentMonths(eventId, body.startMonth, body.termMonths);
    }

    @Post(':eventId/checklist')
    createChecklistItem(@Param('eventId') eventId: number, @Body() body: CreateChecklistItemDto) {
        return this.eventService.createEventChecklist(eventId, body.text, body.date);
    }

    @Get(':eventId/checklist')
    getChecklist(@Param('eventId') eventId: number) {
        return this.eventService.listEventChecklist(eventId);
    }

    @Patch(':eventId/checklist/:itemId/done')
    doneChecklistItem(@Param('itemId') itemId: number) {
        return this.eventService.doneEventChecklistItem(itemId);
    }

    @Delete(':eventId/checklist/:itemId')
    deleteChecklistItem(@Param('itemId') itemId: number) {
        return this.eventService.deleteEventChecklistItem(itemId);
    }

    @Post(':eventId/group')
    createChecklistGroup(@Param('eventId') eventId: number, @Body() body: CreateGroupItemDto) {
        return this.eventService.createEventGroup(eventId, body.text);
    }

    @Get(':eventId/group')
    getGroups(@Param('eventId') eventId: number) {
        return this.eventService.listEventGroup(eventId);
    }

    @Delete(':eventId/group/:itemId')
    deleteGroupItem(@Param('itemId') itemId: number) {
        return this.eventService.deleteEventGroupItem(itemId);
    }
}
