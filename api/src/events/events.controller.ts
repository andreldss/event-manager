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
import { CreateParticipantDto, UpdateParticipantDto } from './dto/participant.dto.js';
import { EventsService } from './events.service.js';
import { UpsertCollectionDto } from './dto/collection.dto.js';
import { CreatePaymentMonthDto } from './dto/paymentmonth.js';
import { CreateChecklistItemDto } from './dto/checklist.js';
import { CreateGroupItemDto } from './dto/group.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { hasAccess } from '../common/auth/has-access.js';
import { AuthUser } from 'src/common/types/auth-user.js';
import { AuditService } from '../audit/audit.service.js';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(
    private eventService: EventsService,
    private auditService: AuditService,
  ) {}

  @Post('create')
  async create(@Req() req: any, @Body() body: CreateEventDto) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para criar eventos.',
      );
    }

    const created = await this.eventService.create(body);
    await this.auditService.log({
      module: 'events',
      action: 'create',
      entityType: 'event',
      entityId: created.id,
      eventId: created.id,
      afterData: created,
      ...this.auditService.getContextFromRequest(req),
    });
    return created;
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

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateEventDto,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'VocÃª nÃ£o tem permissÃ£o para editar eventos.',
      );
    }

    const beforeData = await this.eventService.getById(id);
    const updated = await this.eventService.update(id, body);
    await this.auditService.log({
      module: 'events',
      action: 'update',
      entityType: 'event',
      entityId: id,
      eventId: id,
      beforeData,
      afterData: updated,
      ...this.auditService.getContextFromRequest(req),
    });
    return updated;
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'VocÃª nÃ£o tem permissÃ£o para excluir eventos.',
      );
    }

    const beforeData = await this.eventService.getById(id);
    const removed = await this.eventService.remove(id);
    await this.auditService.log({
      module: 'events',
      action: 'delete',
      entityType: 'event',
      entityId: id,
      eventId: id,
      beforeData,
      afterData: removed,
      ...this.auditService.getContextFromRequest(req),
    });
    return removed;
  }

  @Post('participants')
  async addParticipant(
    @Req() req: any,
    @Body() body: CreateParticipantDto,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar participantes.',
      );
    }

    const created = await this.eventService.addParticipant(
      body.eventId,
      body.name,
      body.groupId ?? null,
    );
    await this.auditService.log({
      module: 'events',
      action: 'participant_create',
      entityType: 'participant',
      entityId: created.id,
      eventId: body.eventId,
      afterData: created,
      ...this.auditService.getContextFromRequest(req),
    });
    return created;
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

  @Patch(':eventId/participants/:participantId')
  async updateParticipant(
    @Req() req: any,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('participantId', ParseIntPipe) participantId: number,
    @Body() body: UpdateParticipantDto,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar participantes.',
      );
    }

    return this.eventService.updateParticipantExpectedAmount(
      eventId,
      participantId,
      body.expectedAmount,
    );
  }

  @Delete(':eventId/participants/:participantId')
  async deleteParticipant(
    @Req() req: any,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('participantId', ParseIntPipe) participantId: number,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'VocÃª nÃ£o tem permissÃ£o para alterar participantes.',
      );
    }

    const deleted = await this.eventService.deleteParticipant(
      eventId,
      participantId,
    );
    await this.auditService.log({
      module: 'events',
      action: 'participant_delete',
      entityType: 'participant',
      entityId: participantId,
      eventId,
      afterData: deleted,
      ...this.auditService.getContextFromRequest(req),
    });
    return deleted;
  }

  @Put(':eventId/collections')
  async upsertCollection(
    @Req() req: any,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() body: UpsertCollectionDto,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar dados do evento.',
      );
    }

    const result = await this.eventService.upsertCollectionPayment(
      eventId,
      body.participantId,
      body.referenceMonth,
      body.amount,
    );
    await this.auditService.log({
      module: 'events',
      action: 'collection_upsert',
      entityType: 'collection',
      entityId: 'id' in result ? result.id : null,
      eventId,
      afterData: result,
      metadata: body,
      ...this.auditService.getContextFromRequest(req),
    });
    return result;
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
  async addEventPaymentMonth(
    @Req() req: any,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() body: CreatePaymentMonthDto,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar dados do evento.',
      );
    }

    const created = await this.eventService.createEventPaymentMonths(
      eventId,
      body.startMonth,
      body.termMonths,
    );
    await this.auditService.log({
      module: 'events',
      action: 'payment_months_create',
      entityType: 'event_payment_months',
      eventId,
      afterData: created,
      metadata: body,
      ...this.auditService.getContextFromRequest(req),
    });
    return created;
  }

  @Post(':eventId/checklist')
  async createChecklistItem(
    @Req() req: any,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() body: CreateChecklistItemDto,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar checklist.',
      );
    }

    const created = await this.eventService.createEventChecklist(
      eventId,
      body.text,
      body.date,
    );
    await this.auditService.log({
      module: 'events',
      action: 'checklist_create',
      entityType: 'event_checklist',
      entityId: created.id,
      eventId,
      afterData: created,
      ...this.auditService.getContextFromRequest(req),
    });
    return created;
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
  async doneChecklistItem(
    @Req() req: any,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar checklist.',
      );
    }

    const done = await this.eventService.doneEventChecklistItem(itemId);
    await this.auditService.log({
      module: 'events',
      action: 'checklist_done',
      entityType: 'event_checklist',
      entityId: itemId,
      afterData: done,
      ...this.auditService.getContextFromRequest(req),
    });
    return done;
  }

  @Delete(':eventId/checklist/:itemId')
  async deleteChecklistItem(
    @Req() req: any,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir itens do checklist.',
      );
    }

    const deleted = await this.eventService.deleteEventChecklistItem(itemId);
    await this.auditService.log({
      module: 'events',
      action: 'checklist_delete',
      entityType: 'event_checklist',
      entityId: itemId,
      afterData: deleted,
      ...this.auditService.getContextFromRequest(req),
    });
    return deleted;
  }

  @Post(':eventId/group')
  async createChecklistGroup(
    @Req() req: any,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() body: CreateGroupItemDto,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar grupos do evento.',
      );
    }

    const created = await this.eventService.createEventGroup(eventId, body.text);
    await this.auditService.log({
      module: 'events',
      action: 'group_create',
      entityType: 'event_group',
      entityId: created.id,
      eventId,
      afterData: created,
      ...this.auditService.getContextFromRequest(req),
    });
    return created;
  }

  @Get(':eventId/group')
  getGroups(@Req() req: any, @Param('eventId', ParseIntPipe) eventId: number) {
    if (!hasAccess(req.user, 'eventsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos eventos.');
    }

    return this.eventService.listEventGroup(eventId);
  }

  @Delete(':eventId/group/:itemId')
  async deleteGroupItem(
    @Req() req: any,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    if (!hasAccess(req.user, 'eventsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir grupos do evento.',
      );
    }

    const deleted = await this.eventService.deleteEventGroupItem(itemId);
    await this.auditService.log({
      module: 'events',
      action: 'group_delete',
      entityType: 'event_group',
      entityId: itemId,
      afterData: deleted,
      ...this.auditService.getContextFromRequest(req),
    });
    return deleted;
  }
}
