import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service.js';
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

  @Get('items')
  listItems(
    @Query('eventId') eventId: string,
    @Query('parentId') parentId?: string,
    @Query('cursor') cursor?: string,
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

    return this.storageService.listItems(eventIdNum, parentIdNum, cursorNum);
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

    const results = await Promise.all(
      files.map((file) =>
        this.storageService.uploadFile(eventIdNum, parentIdNum, file, userId),
      ),
    );

    return results;
  }

  @Get('nodes/:id/thumbnail')
  async serveThumbnail(@Param('id') id: string, @Res() res: Response) {
    const thumbPath = await this.storageService.getThumbnailPath(Number(id));
    return res.sendFile(thumbPath);
  }
}