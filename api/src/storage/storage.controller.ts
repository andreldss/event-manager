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
import type { AuthUser } from '../common/types/auth-user.js';
import { AuditService } from '../audit/audit.service.js';

@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
  ) {}

  @Post('folder')
  async createFolder(@Body() body: CreateFolderDto, @Req() req: any) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'manage')) {
      throw new ForbiddenException('Você não tem permissão para alterar anexos.');
    }

    const userId = req.user?.id ?? null;
    const created = await this.storageService.createFolder(body, userId);
    await this.auditService.log({
      module: 'storage',
      action: 'folder_create',
      entityType: 'storage_node',
      entityId: created.id,
      eventId: created.eventId ?? body.eventId ?? null,
      afterData: created,
      ...this.auditService.getContextFromRequest(req),
    });
    return created;
  }

  @Get('folders')
  listAllFolders(@Req() req: { user: AuthUser }, @Query('eventId') eventId?: string) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos anexos.');
    }

    const eventIdNum =
      eventId !== undefined && eventId !== '' ? Number(eventId) : undefined;

    if (eventIdNum !== undefined && Number.isNaN(eventIdNum)) {
      throw new BadRequestException('eventId inválido.');
    }

    return this.storageService.listAllFolders(eventIdNum);
  }

  @Get('breadcrumb')
  getBreadcrumb(
    @Req() req: { user: AuthUser },
    @Query('folderId') folderId?: string,
    @Query('eventId') eventId?: string,
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos anexos.');
    }

    const folderIdNum =
      folderId !== undefined && folderId !== '' ? Number(folderId) : undefined;

    const eventIdNum =
      eventId !== undefined && eventId !== '' ? Number(eventId) : undefined;

    if (folderIdNum !== undefined && Number.isNaN(folderIdNum)) {
      throw new BadRequestException('folderId inválido.');
    }

    if (eventIdNum !== undefined && Number.isNaN(eventIdNum)) {
      throw new BadRequestException('eventId inválido.');
    }

    return this.storageService.getBreadcrumb(folderIdNum, eventIdNum);
  }

  @Get('items')
  listItems(
    @Req() req: { user: AuthUser },
    @Query('eventId') eventId?: string,
    @Query('parentId') parentId?: string,
    @Query('cursor') cursor?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos anexos.');
    }

    const eventIdNum =
      eventId !== undefined && eventId !== '' ? Number(eventId) : undefined;

    if (eventIdNum !== undefined && Number.isNaN(eventIdNum)) {
      throw new BadRequestException('eventId inválido.');
    }

    const parentIdNum =
      parentId !== undefined && parentId !== '' ? Number(parentId) : null;

    if (parentIdNum !== null && Number.isNaN(parentIdNum)) {
      throw new BadRequestException('parentId inválido.');
    }

    const cursorNum =
      cursor !== undefined && cursor !== '' ? Number(cursor) : undefined;

    if (cursorNum !== undefined && Number.isNaN(cursorNum)) {
      throw new BadRequestException('cursor inválido.');
    }

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
    @UploadedFiles() files: Express.Multer.File[],
    @Body('eventId') eventId?: string,
    @Body('parentId') parentId?: string,
    @Req() req?: { user: AuthUser },
  ) {
    if (!req?.user || !hasAccess(req.user, 'attachmentsAccess', 'manage')) {
      throw new ForbiddenException('Você não tem permissão para alterar anexos.');
    }

    const eventIdNum =
      eventId !== undefined && eventId !== '' ? Number(eventId) : undefined;

    if (eventIdNum !== undefined && Number.isNaN(eventIdNum)) {
      throw new BadRequestException('eventId inválido.');
    }

    const parentIdNum =
      parentId !== undefined && parentId !== '' ? Number(parentId) : null;

    if (parentIdNum !== null && Number.isNaN(parentIdNum)) {
      throw new BadRequestException('parentId inválido.');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const userId = req?.user?.id ?? null;

    const uploaded = await Promise.all(
      files.map((file) =>
        this.storageService.uploadFile(eventIdNum, parentIdNum, file, userId),
      ),
    );
    await this.auditService.log({
      module: 'storage',
      action: 'file_upload',
      entityType: 'storage_node',
      eventId: uploaded[0]?.eventId ?? eventIdNum ?? null,
      metadata: {
        count: uploaded.length,
        parentId: parentIdNum,
        ids: uploaded.map((item) => item.id),
      },
      afterData: uploaded,
      ...this.auditService.getContextFromRequest(req as any),
    });
    return uploaded;
  }

  @Get('nodes/:id/thumbnail')
  async serveThumbnail(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos anexos.');
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
      throw new ForbiddenException('Você não tem acesso aos anexos.');
    }

    const { absPath, mimeType } = await this.storageService.getFilePath(id);

    if (mimeType) {
      res.setHeader('Content-Type', mimeType);
    }

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
      throw new ForbiddenException('Você não tem acesso aos anexos.');
    }

    const { absPath, name } = await this.storageService.getFilePath(id);
    return res.download(absPath, name);
  }

  @Post('download-zip')
  async downloadSelectedZip(
    @Req() req: { user: AuthUser },
    @Body('nodeIds') nodeIds: number[],
    @Res() res: Response,
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'view')) {
      throw new ForbiddenException('VocÃª nÃ£o tem acesso aos anexos.');
    }

    return this.storageService.downloadSelectedFilesZip(nodeIds, res);
  }

  @Get('global-root')
  getGlobalRoot(@Req() req: { user: AuthUser }, @Query('clientId') clientId?: string) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'view')) {
      throw new ForbiddenException('Você não tem acesso aos anexos.');
    }

    const clientIdNum =
      clientId !== undefined && clientId !== '' ? Number(clientId) : undefined;

    if (clientIdNum !== undefined && Number.isNaN(clientIdNum)) {
      throw new BadRequestException('clientId inválido.');
    }

    return this.storageService.getGlobalRoot(clientIdNum);
  }

  @Patch('nodes/:id/rename')
  async renameNode(
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name: string,
    @Req() req: { user: AuthUser },
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'manage')) {
      throw new ForbiddenException('Você não tem permissão para alterar anexos.');
    }

    if (!name) {
      throw new BadRequestException('Nome é obrigatório.');
    }

    const renamed = await this.storageService.renameNode(id, name, req.user?.id ?? null);
    await this.auditService.log({
      module: 'storage',
      action: 'rename',
      entityType: 'storage_node',
      entityId: id,
      afterData: renamed,
      metadata: { name },
      ...this.auditService.getContextFromRequest(req as any),
    });
    return renamed;
  }

  @Patch('nodes/:id/move')
  async moveNode(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
    @Body('targetParentId') targetParentId: number | null,
    @Body('eventId') eventId?: number,
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'manage')) {
      throw new ForbiddenException('Você não tem permissão para alterar anexos.');
    }

    const moved = await this.storageService.moveNode(id, targetParentId ?? null, eventId);
    await this.auditService.log({
      module: 'storage',
      action: 'move',
      entityType: 'storage_node',
      entityId: id,
      eventId: eventId ?? null,
      afterData: moved,
      metadata: { targetParentId },
      ...this.auditService.getContextFromRequest(req as any),
    });
    return moved;
  }

  @Delete('nodes/:id')
  async deleteNode(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'manage')) {
      throw new ForbiddenException('Você não tem permissão para alterar anexos.');
    }

    const deleted = await this.storageService.deleteNode(id);
    await this.auditService.log({
      module: 'storage',
      action: 'delete',
      entityType: 'storage_node',
      entityId: id,
      afterData: deleted,
      ...this.auditService.getContextFromRequest(req),
    });
    return deleted;
  }
}
