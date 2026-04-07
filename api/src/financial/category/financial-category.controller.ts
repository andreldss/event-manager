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
import { CreateFinancialCategoryDto } from './dto/category.dto.js';
import { FinancialCategoryService } from './financial-category.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { hasAccess } from '../../common/auth/has-access.js';
import { AuthUser } from 'src/common/types/auth-user.js';

@UseGuards(JwtAuthGuard)
@Controller('financial-category')
export class FinancialCategoryController {
  constructor(private readonly service: FinancialCategoryService) {}

  @Get()
  list(@Req() req: { user: AuthUser }) {
    if (!hasAccess(req.user, 'recordsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos cadastros.');
    }

    return this.service.list();
  }

  @Post()
  create(
    @Req() req: { user: AuthUser },
    @Body() body: CreateFinancialCategoryDto,
  ) {
    if (!hasAccess(req.user, 'recordsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para criar cadastros.',
      );
    }

    return this.service.create(body.name);
  }

  @Patch(':id')
  update(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateFinancialCategoryDto,
  ) {
    if (!hasAccess(req.user, 'recordsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para editar cadastros.',
      );
    }

    return this.service.update(id, body.name);
  }

  @Get('count')
  count(@Req() req: { user: AuthUser }) {
    return this.service.getCount();
  }

  @Get(':id')
  getById(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!hasAccess(req.user, 'recordsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos cadastros.');
    }

    return this.service.getById(id);
  }

  @Delete(':id')
  remove(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!hasAccess(req.user, 'recordsAccess', 'manage')) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir cadastros.',
      );
    }

    return this.service.remove(id);
  }
}
