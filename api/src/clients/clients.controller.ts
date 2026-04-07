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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service.js';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { hasAccess } from '../common/auth/has-access.js';
import { AuthUser } from 'src/common/types/auth-user.js';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private clientService: ClientsService) {}

  @Post()
  register(@Req() req: { user: AuthUser }, @Body() body: CreateClientDto) {
    if (!hasAccess(req.user, 'recordsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para criar cadastros.',
      );
    }

    return this.clientService.create(body);
  }

  @Get()
  findAll(@Req() req: { user: AuthUser }) {
    if (!hasAccess(req.user, 'recordsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos cadastros.');
    }

    return this.clientService.getAll();
  }

  @Get('count')
  count(@Req() req: { user: AuthUser }) {
    return this.clientService.getCount();
  }

  @Get(':id')
  findOne(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!hasAccess(req.user, 'recordsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos cadastros.');
    }

    return this.clientService.getOne(id);
  }

  @Patch(':id')
  update(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateClientDto,
  ) {
    if (!hasAccess(req.user, 'recordsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para editar cadastros.',
      );
    }

    return this.clientService.update(id, body);
  }

  @Delete(':id')
  delete(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!hasAccess(req.user, 'recordsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir cadastros.',
      );
    }

    return this.clientService.delete(id);
  }
}
