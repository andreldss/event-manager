import { Controller, Get, Post, Body, Req, Query, BadRequestException } from '@nestjs/common';
import { StorageService } from './storage.service.js';
import type { CreateFolderDto } from './dto/folder/create-folder.dto.js';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('folder')
  createFolder(@Body() body: CreateFolderDto, @Req() req: any) {
    const userId = req.user?.id ?? null;
    return this.storageService.createFolder(body, userId);
  }

  // GET /storage/folders?eventId=3&parentId=12
  @Get('folders')
  listFolders(
    @Query('eventId') eventId: string,
    @Query('parentId') parentId?: string,
  ) {
    const eventIdNum = Number(eventId);

    if (!eventId || Number.isNaN(eventIdNum)) {
      throw new BadRequestException('eventId inválido.');
    }

    const parentIdNum =
      parentId !== undefined && parentId !== null && parentId !== ''
        ? Number(parentId)
        : null;

    if (parentIdNum !== null && Number.isNaN(parentIdNum)) {
      throw new BadRequestException('parentId inválido.');
    }

    return this.storageService.listFolders(eventIdNum, parentIdNum);
  }
}