import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateFolderDto } from './dto/folder/create-folder.dto.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

@Injectable()
export class StorageService {
  constructor(private readonly prisma: PrismaService) { }

  private readonly storageRoot =
    process.env.STORAGE_ROOT || path.join(process.cwd(), 'storage');

  private sanitizeFolderName(name: string) {
    return name
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, 80);
  }

  async createFolder(body: CreateFolderDto, userId: number | null) {
    if (!body.name || typeof body.name !== 'string') {
      throw new BadRequestException('Nome da pasta inválido.');
    }

    const name = this.sanitizeFolderName(body.name);
    if (!name)
      throw new BadRequestException('Nome da pasta não pode ser vazio.');

    if (!body.eventId || typeof body.eventId !== 'number') {
      throw new BadRequestException('EventId inválido.');
    }

    const parentId = body.parentId ?? null;

    let parent: {
      id: number;
      eventId: number;
      type: string;
      storageKey: string | null;
    } | null = null;

    if (parentId !== null) {
      parent = await this.prisma.storageNode.findUnique({
        where: { id: parentId },
        select: { id: true, eventId: true, type: true, storageKey: true },
      });

      if (!parent) throw new BadRequestException('Pasta pai não encontrada.');
      if (parent.eventId !== body.eventId)
        throw new BadRequestException('Pasta pai não pertence a este evento.');
      if (parent.type !== 'folder')
        throw new BadRequestException('parentId precisa ser uma pasta.');
      if (!parent.storageKey)
        throw new BadRequestException(
          'Pasta pai sem storageKey (inconsistência).',
        );
    }

    const eventId = body.eventId

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true },
    });

    if (!event) {
      throw new BadRequestException("Evento não encontrado.");
    }

    const baseKey = parent
      ? (parent.storageKey as string)
      : `events/${eventId + ' - ' + event.name}`;
    const storageKey = `${baseKey}/${name}`;

    const created = await this.prisma.storageNode.create({
      data: {
        name,
        type: 'folder',
        eventId: body.eventId,
        parentId,
        createdById: userId ?? null,
        storageKey,
      },
      select: { id: true, eventId: true, storageKey: true },
    });

    if (!created.storageKey) {
      await this.prisma.storageNode
        .delete({ where: { id: created.id } })
        .catch(() => { });
      throw new InternalServerErrorException(
        'storageKey não foi gerado corretamente.',
      );
    }

    const folderPath = path.join(
      this.storageRoot,
      ...created.storageKey.split('/'),
    );

    try {
      await fs.mkdir(folderPath, { recursive: true });
      return created;
    } catch (err) {
      await this.prisma.storageNode
        .delete({ where: { id: created.id } })
        .catch(() => { });
      throw new InternalServerErrorException('Falha ao criar pasta no disco.');
    }
  }

  async listFolders(eventId: number, parentId: number | null) {
    return this.prisma.storageNode.findMany({
      where: {
        eventId,
        parentId,
        type: 'folder',
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        eventId: true,
        parentId: true,
        updatedAt: true,
      },
    });
  }
}
