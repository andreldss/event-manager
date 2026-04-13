import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AuthUser } from '../common/types/auth-user.js';
import { AuditService } from './audit.service.js';

@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(
    @Req() req: { user: AuthUser },
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('actorType') actorType?: 'user' | 'public_share' | 'system',
    @Query('actorUserId') actorUserId?: string,
    @Query('eventId') eventId?: string,
    @Query('search') search?: string,
  ) {
    this.ensureAdmin(req.user);

    return this.auditService.list({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      module,
      action,
      entityType,
      actorType,
      actorUserId: actorUserId ? Number(actorUserId) : undefined,
      eventId: eventId ? Number(eventId) : undefined,
      search,
    });
  }

  @Get(':id')
  async findOne(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.ensureAdmin(req.user);

    const item = await this.auditService.findOne(id);
    if (!item) {
      throw new NotFoundException('Log não encontrado.');
    }

    return item;
  }

  private ensureAdmin(user: AuthUser) {
    if (!user?.isAdmin) {
      throw new ForbiddenException(
        'Somente administradores podem acessar os logs.',
      );
    }
  }
}
