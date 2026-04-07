import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateEventDto } from './dto/event.dto.js';
import { CreateParticipantDto } from './dto/participant.dto.js';
import { EventsService } from './events.service.js';
import { UpsertCollectionDto } from './dto/collection.dto.js';
import { CreatePaymentMonthDto } from './dto/paymentmonth.js';
import { CreateChecklistItemDto } from './dto/checklist.js';
import { CreateGroupItemDto } from './dto/group.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { hasAccess } from '../common/auth/has-access.js';
import { AuthUser } from 'src/common/types/auth-user.js';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private eventService: EventsService) {}

  @Post('create')
  create(@Req() req: { user: AuthUser }, @Body() body: CreateEventDto) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para criar eventos.',
      );
    }

    return this.eventService.create(body);
  }

  @Get()
  findAll(@Req() req: { user: AuthUser }) {
    if (!hasAccess(req.user, 'eventsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos eventos.');
    }

    return this.eventService.getAll();
  }

  @Get(':id')
  getById(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos eventos.');
    }

    return this.eventService.getById(id);
  }

  @Post('participants')
  addParticipant(
    @Req() req: { user: AuthUser },
    @Body() body: CreateParticipantDto,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar participantes.',
      );
    }

    return this.eventService.addParticipant(
      body.eventId,
      body.name,
      body.groupId ?? null,
    );
  }

  @Get(':eventId/participants')
  getParticipants(
    @Req() req: { user: AuthUser },
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos eventos.');
    }

    return this.eventService.getParticipants(eventId);
  }

  @Put(':eventId/collections')
  upsertCollection(
    @Req() req: { user: AuthUser },
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() body: UpsertCollectionDto,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar dados do evento.',
      );
    }

    return this.eventService.upsertCollectionPayment(
      eventId,
      body.participantId,
      body.referenceMonth,
      body.amount,
    );
  }

  @Get(':eventId/collections')
  getCollections(
    @Req() req: { user: AuthUser },
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos eventos.');
    }

    return this.eventService.getCollections(eventId);
  }

  @Get(':eventId/event_payment_months')
  getEventPaymentMonths(
    @Req() req: { user: AuthUser },
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos eventos.');
    }

    return this.eventService.getEventPaymentsMonths(eventId);
  }

  @Post(':eventId/event_payment_months')
  addEventPaymentMonth(
    @Req() req: { user: AuthUser },
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() body: CreatePaymentMonthDto,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar dados do evento.',
      );
    }

    return this.eventService.createEventPaymentMonths(
      eventId,
      body.startMonth,
      body.termMonths,
    );
  }

  @Post(':eventId/checklist')
  createChecklistItem(
    @Req() req: any,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() body: CreateChecklistItemDto,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar checklist.',
      );
    }

    return this.eventService.createEventChecklist(
      eventId,
      body.text,
      body.date,
    );
  }

  @Get(':eventId/checklist')
  getChecklist(
    @Req() req: any,
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos eventos.');
    }

    return this.eventService.listEventChecklist(eventId);
  }

  @Patch(':eventId/checklist/:itemId/done')
  doneChecklistItem(
    @Req() req: any,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar checklist.',
      );
    }

    return this.eventService.doneEventChecklistItem(itemId);
  }

  @Delete(':eventId/checklist/:itemId')
  deleteChecklistItem(
    @Req() req: any,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir itens do checklist.',
      );
    }

    return this.eventService.deleteEventChecklistItem(itemId);
  }

  @Post(':eventId/group')
  createChecklistGroup(
    @Req() req: any,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() body: CreateGroupItemDto,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar grupos do evento.',
      );
    }

    return this.eventService.createEventGroup(eventId, body.text);
  }

  @Get(':eventId/group')
  getGroups(@Req() req: any, @Param('eventId', ParseIntPipe) eventId: number) {
    if (!hasAccess(req.user, 'eventsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos eventos.');
    }

    return this.eventService.listEventGroup(eventId);
  }

  @Delete(':eventId/group/:itemId')
  deleteGroupItem(
    @Req() req: any,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir grupos do evento.',
      );
    }

    return this.eventService.deleteEventGroupItem(itemId);
  }
}
