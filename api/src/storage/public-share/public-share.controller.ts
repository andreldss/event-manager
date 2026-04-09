import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { StoragePublicService } from './public-share.service.js';
import type { CreatePublicShareDto } from './dto/public-share.dto.js';

@Controller('storage')
export class StoragePublicController {
  constructor(private readonly storageService: StoragePublicService) {}

  @Post('public-share')
  createPublicShare(@Body() body: CreatePublicShareDto) {
    return this.storageService.createPublicShare(body);
  }

  @Get('nodes/:id/public-shares')
  listNodePublicShares(@Param('id') id: string) {
    const nodeId = Number(id);

    if (Number.isNaN(nodeId)) {
      throw new BadRequestException('ID inválido.');
    }

    return this.storageService.listNodePublicShares(nodeId);
  }

  @Patch('public-share/:id/revoke')
  revokePublicShare(@Param('id') id: string) {
    const shareId = Number(id);

    if (Number.isNaN(shareId)) {
      throw new BadRequestException('ID inválido.');
    }

    return this.storageService.revokePublicShare(shareId);
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

  @Get('public/:token/download-zip')
  downloadPublicZip(@Param('token') token: string, @Res() res: Response) {
    return this.storageService.downloadPublicZip(token, res);
  }
}
