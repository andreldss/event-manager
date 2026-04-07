import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { StorageService, SortField, SortOrder } from './storage.service.js';
import type { CreateFolderDto } from './dto/folder/create-folder.dto.js';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { hasAccess } from '../common/auth/has-access.js';
import { AuthUser } from 'src/common/types/auth-user.js';

@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('folder')
  createFolder(@Body() body: CreateFolderDto, @Req() req: { user: AuthUser }) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'manage')) {
      throw new ForbiddenException('Sem permissão para criar pastas.');
    }

    const userId = req.user?.id ?? null;
    return this.storageService.createFolder(body, userId);
  }

  @Get('folders')
  listAllFolders(
    @Req() req: { user: AuthUser },
    @Query('eventId') eventId: string,
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'view')) {
      throw new ForbiddenException('Sem acesso aos anexos.');
    }

    const eventIdNum = Number(eventId);
    if (!eventId || Number.isNaN(eventIdNum))
      throw new BadRequestException('eventId inválido.');

    return this.storageService.listAllFolders(eventIdNum);
  }

  @Get('breadcrumb')
  getBreadcrumb(
    @Req() req: { user: AuthUser },
    @Query('folderId') folderId: string,
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'view')) {
      throw new ForbiddenException('Sem acesso aos anexos.');
    }

    const id = Number(folderId);
    if (!folderId || Number.isNaN(id))
      throw new BadRequestException('folderId inválido.');

    return this.storageService.getBreadcrumb(id);
  }

  @Get('items')
  listItems(
    @Req() req: { user: AuthUser },
    @Query('eventId') eventId: string,
    @Query('parentId') parentId?: string,
    @Query('cursor') cursor?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'view')) {
      throw new ForbiddenException('Sem acesso aos anexos.');
    }

    const eventIdNum = Number(eventId);
    if (!eventId || Number.isNaN(eventIdNum))
      throw new BadRequestException('eventId inválido.');

    const parentIdNum =
      parentId !== undefined && parentId !== '' ? Number(parentId) : null;
    if (parentIdNum !== null && Number.isNaN(parentIdNum))
      throw new BadRequestException('parentId inválido.');

    const cursorNum =
      cursor !== undefined && cursor !== '' ? Number(cursor) : undefined;
    if (cursorNum !== undefined && Number.isNaN(cursorNum))
      throw new BadRequestException('cursor inválido.');

    const validSortFields: SortField[] = ['name', 'updatedAt', 'size'];
    const validSortOrders: SortOrder[] = ['asc', 'desc'];

    const sf: SortField = validSortFields.includes(sortField as SortField)
      ? (sortField as SortField)
      : 'name';

    const so: SortOrder = validSortOrders.includes(sortOrder as SortOrder)
      ? (sortOrder as SortOrder)
      : 'asc';

    return this.storageService.listItems(
      eventIdNum,
      parentIdNum,
      cursorNum,
      sf,
      so,
    );
  }

  @Post('files')
  @UseInterceptors(FilesInterceptor('files', 50))
  async uploadFiles(
    @Req() req: { user: AuthUser },
    @UploadedFiles() files: Express.Multer.File[],
    @Body('eventId') eventId: string,
    @Body('parentId') parentId?: string,
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'manage')) {
      throw new ForbiddenException('Sem permissão para upload.');
    }

    const eventIdNum = Number(eventId);
    if (!eventId || Number.isNaN(eventIdNum))
      throw new BadRequestException('eventId inválido.');

    const parentIdNum =
      parentId !== undefined && parentId !== '' ? Number(parentId) : null;
    if (parentIdNum !== null && Number.isNaN(parentIdNum))
      throw new BadRequestException('parentId inválido.');

    if (!files || files.length === 0)
      throw new BadRequestException('Nenhum arquivo enviado.');

    const userId = req?.user?.id ?? null;

    return Promise.all(
      files.map((file) =>
        this.storageService.uploadFile(eventIdNum, parentIdNum, file, userId),
      ),
    );
  }

  @Get('nodes/:id/thumbnail')
  async serveThumbnail(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'view')) {
      throw new ForbiddenException('Sem acesso aos anexos.');
    }

    const thumbPath = await this.storageService.getThumbnailPath(id);
    return res.sendFile(thumbPath);
  }

  @Get('nodes/:id/raw')
  async serveRaw(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'view')) {
      throw new ForbiddenException('Sem acesso aos anexos.');
    }

    const { absPath, mimeType } = await this.storageService.getFilePath(id);
    if (mimeType) res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.sendFile(absPath);
  }

  @Get('nodes/:id/download')
  async downloadFile(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'view')) {
      throw new ForbiddenException('Sem acesso aos anexos.');
    }

    const { absPath, name } = await this.storageService.getFilePath(id);
    return res.download(absPath, name);
  }

  @Patch('nodes/:id/rename')
  renameNode(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name: string,
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'manage')) {
      throw new ForbiddenException('Sem permissão para editar arquivos.');
    }

    if (!name) throw new BadRequestException('Nome é obrigatório.');

    return this.storageService.renameNode(id, name, req.user?.id ?? null);
  }

  @Patch('nodes/:id/move')
  moveNode(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
    @Body('targetParentId') targetParentId: number | null,
    @Body('eventId') eventId: number,
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'manage')) {
      throw new ForbiddenException('Sem permissão para mover arquivos.');
    }

    if (!eventId) throw new BadRequestException('eventId é obrigatório.');

    return this.storageService.moveNode(id, targetParentId ?? null, eventId);
  }

  @Delete('nodes/:id')
  deleteNode(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'manage')) {
      throw new ForbiddenException('Sem permissão para excluir arquivos.');
    }

    return this.storageService.deleteNode(id);
  }
}
