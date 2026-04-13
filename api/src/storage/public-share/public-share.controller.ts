import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Param,
  Patch,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { StoragePublicService } from './public-share.service.js';
import type { CreatePublicShareDto } from './dto/public-share.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { hasAccess } from '../../common/auth/has-access.js';
import type { AuthUser } from '../../common/types/auth-user.js';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuditService } from '../../audit/audit.service.js';

@Controller('storage')
export class StoragePublicController {
  constructor(
    private readonly storageService: StoragePublicService,
    private readonly auditService: AuditService,
  ) {}

  @Post('public-share')
  @UseGuards(JwtAuthGuard)
  async createPublicShare(
    @Body() body: CreatePublicShareDto,
    @Req() req: any,
  ) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'manage')) {
      throw new ForbiddenException('Sem permissão para compartilhar anexos.');
    }

    const created = await this.storageService.createPublicShare(body);
    await this.auditService.log({
      module: 'public_share',
      action: 'create',
      entityType: 'storage_node_public_share',
      entityId: created.id,
      afterData: created,
      ...this.auditService.getContextFromRequest(req),
    });
    return created;
  }

  @Get('nodes/:id/public-shares')
  @UseGuards(JwtAuthGuard)
  listNodePublicShares(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'manage')) {
      throw new ForbiddenException('Sem permissão para ver links públicos.');
    }

    const nodeId = Number(id);

    if (Number.isNaN(nodeId)) {
      throw new BadRequestException('ID inválido.');
    }

    return this.storageService.listNodePublicShares(nodeId);
  }

  @Patch('public-share/:id/revoke')
  @UseGuards(JwtAuthGuard)
  async revokePublicShare(@Param('id') id: string, @Req() req: any) {
    if (!hasAccess(req.user, 'attachmentsAccess', 'manage')) {
      throw new ForbiddenException('Sem permissão para revogar links públicos.');
    }

    const shareId = Number(id);

    if (Number.isNaN(shareId)) {
      throw new BadRequestException('ID inválido.');
    }

    const revoked = await this.storageService.revokePublicShare(shareId);
    await this.auditService.log({
      module: 'public_share',
      action: 'revoke',
      entityType: 'storage_node_public_share',
      entityId: shareId,
      afterData: revoked,
      ...this.auditService.getContextFromRequest(req),
    });
    return revoked;
  }

  @Get('public/:token')
  getPublicShare(@Param('token') token: string) {
    return this.storageService.getPublicShare(token);
  }

  @Get('public/:token/items')
  getPublicItems(
    @Param('token') token: string,
    @Query('parentId') parentId?: string,
  ) {
    return this.storageService.getPublicItems(token, parentId);
  }

  @Get('public/:token/breadcrumb')
  getPublicBreadcrumb(
    @Param('token') token: string,
    @Query('folderId') folderId?: string,
  ) {
    return this.storageService.getPublicBreadcrumb(token, folderId);
  }

  @Get('public/:token/files/:fileId/download')
  downloadPublicFile(
    @Param('token') token: string,
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const parsedFileId = Number(fileId);

    if (Number.isNaN(parsedFileId)) {
      throw new BadRequestException('ID do arquivo inválido.');
    }

    return this.storageService.downloadPublicFile(token, parsedFileId, res);
  }

  @Get('public/:token/files/:fileId/raw')
  servePublicRaw(
    @Param('token') token: string,
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const parsedFileId = Number(fileId);

    if (Number.isNaN(parsedFileId)) {
      throw new BadRequestException('ID do arquivo inválido.');
    }

    return this.storageService.servePublicRawFile(token, parsedFileId, res);
  }

  @Get('public/:token/files/:fileId/thumbnail')
  servePublicThumbnail(
    @Param('token') token: string,
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const parsedFileId = Number(fileId);

    if (Number.isNaN(parsedFileId)) {
      throw new BadRequestException('ID do arquivo inválido.');
    }

    return this.storageService.servePublicThumbnail(token, parsedFileId, res);
  }

  @Get('public/:token/download-zip')
  downloadPublicZip(@Param('token') token: string, @Res() res: Response) {
    return this.storageService.downloadPublicZip(token, res);
  }

  @Post('public/:token/download-zip')
  async downloadPublicSelectedZip(
    @Param('token') token: string,
    @Body('nodeIds') nodeIds: number[],
    @Res() res: Response,
  ) {
    await this.auditService.log({
      module: 'public_share',
      action: 'download_zip_selected',
      entityType: 'storage_node_public_share',
      actorType: 'public_share',
      metadata: { token, nodeIds },
    });
    return this.storageService.downloadPublicSelectedZip(token, nodeIds, res);
  }

  @Post('public/:token/folder')
  async createPublicFolder(
    @Param('token') token: string,
    @Body('name') name: string,
    @Body('parentId') parentId?: string,
  ) {
    const parsedParentId =
      parentId !== undefined && parentId !== '' ? Number(parentId) : undefined;

    if (parsedParentId !== undefined && Number.isNaN(parsedParentId)) {
      throw new BadRequestException('parentId inválido.');
    }

    const created = await this.storageService.createPublicFolder(
      token,
      name,
      parsedParentId,
    );
    await this.auditService.log({
      module: 'public_share',
      action: 'folder_create',
      entityType: 'storage_node',
      entityId: created.id,
      eventId: created.eventId ?? null,
      actorType: 'public_share',
      afterData: created,
      metadata: { token, parentId: parsedParentId },
    });
    return created;
  }

  @Post('public/:token/files')
  @UseInterceptors(FilesInterceptor('files', 50))
  async uploadPublicFiles(
    @Param('token') token: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('parentId') parentId?: string,
  ) {
    const parsedParentId =
      parentId !== undefined && parentId !== '' ? Number(parentId) : undefined;

    if (parsedParentId !== undefined && Number.isNaN(parsedParentId)) {
      throw new BadRequestException('parentId inválido.');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const uploaded = await this.storageService.uploadPublicFiles(
      token,
      files,
      parsedParentId,
    );
    await this.auditService.log({
      module: 'public_share',
      action: 'file_upload',
      entityType: 'storage_node',
      eventId: uploaded[0]?.eventId ?? null,
      actorType: 'public_share',
      afterData: uploaded,
      metadata: {
        token,
        parentId: parsedParentId,
        count: uploaded.length,
        ids: uploaded.map((item) => item.id),
      },
    });
    return uploaded;
  }
}
