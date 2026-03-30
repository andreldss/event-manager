import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { StorageService, SortField, SortOrder } from './storage.service.js';
import type { CreateFolderDto } from './dto/folder/create-folder.dto.js';
import type { Response } from 'express';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) { }

  @Post('folder')
  createFolder(@Body() body: CreateFolderDto, @Req() req: any) {
    const userId = req.user?.id ?? null;
    return this.storageService.createFolder(body, userId);
  }

  @Get('folders')
  listAllFolders(@Query('eventId') eventId: string) {
    const eventIdNum = Number(eventId);
    if (!eventId || Number.isNaN(eventIdNum))
      throw new BadRequestException('eventId inválido.');
    return this.storageService.listAllFolders(eventIdNum);
  }

  @Get('breadcrumb')
  getBreadcrumb(@Query('folderId') folderId: string) {
    const id = Number(folderId);
    if (!folderId || Number.isNaN(id))
      throw new BadRequestException('folderId inválido.');
    return this.storageService.getBreadcrumb(id);
  }

  @Get('items')
  listItems(
    @Query('eventId') eventId: string,
    @Query('parentId') parentId?: string,
    @Query('cursor') cursor?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
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
      ? (sortField as SortField) : 'name';

    const so: SortOrder = validSortOrders.includes(sortOrder as SortOrder)
      ? (sortOrder as SortOrder) : 'asc';

    return this.storageService.listItems(eventIdNum, parentIdNum, cursorNum, sf, so);
  }

  @Post('files')
  @UseInterceptors(FilesInterceptor('files', 50))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('eventId') eventId: string,
    @Body('parentId') parentId?: string,
    @Req() req?: any,
  ) {
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
  async serveThumbnail(@Param('id') id: string, @Res() res: Response) {
    const thumbPath = await this.storageService.getThumbnailPath(Number(id));
    return res.sendFile(thumbPath);
  }

  @Get('nodes/:id/raw')
  async serveRaw(@Param('id') id: string, @Res() res: Response) {
    const { absPath, mimeType } = await this.storageService.getFilePath(Number(id));
    if (mimeType) res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.sendFile(absPath);
  }

  @Get('nodes/:id/download')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const { absPath, name } = await this.storageService.getFilePath(Number(id));
    return res.download(absPath, name);
  }

  @Patch('nodes/:id/rename')
  renameNode(
    @Param('id') id: string,
    @Body('name') name: string,
    @Req() req: any,
  ) {
    if (!name) throw new BadRequestException('Nome é obrigatório.');
    return this.storageService.renameNode(Number(id), name, req.user?.id ?? null);
  }

  @Patch('nodes/:id/move')
  moveNode(
    @Param('id') id: string,
    @Body('targetParentId') targetParentId: number | null,
    @Body('eventId') eventId: number,
  ) {
    if (!eventId) throw new BadRequestException('eventId é obrigatório.');
    return this.storageService.moveNode(Number(id), targetParentId ?? null, eventId);
  }

  @Delete('nodes/:id')
  deleteNode(@Param('id') id: string) {
    return this.storageService.deleteNode(Number(id));
  }
}