import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createReadStream, existsSync } from 'fs';
import type { Response } from 'express';
import * as archiver from 'archiver';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';

const THUMBNAIL_SIZE = 400;
const PAGE_SIZE = 50;

export type SortField = 'name' | 'updatedAt' | 'size';
export type SortOrder = 'asc' | 'desc';

type CreateFolderInput = {
  name: string;
  eventId?: number;
  parentId?: number | null;
};

@Injectable()
export class StorageService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly storageRoot =
    process.env.STORAGE_ROOT || path.join(process.cwd(), 'storage');

  private get thumbnailRoot() {
    return path.join(this.storageRoot, '_thumbnails');
  }

  private assertSafePath(resolved: string, root: string) {
    if (!resolved.startsWith(root + path.sep) && resolved !== root) {
      throw new BadRequestException('Caminho inválido.');
    }
  }

  private sanitizeName(name: string): string {
    return name
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, 80);
  }

  private sanitizeFileName(fileName: string): string {
    const ext = path.extname(fileName || '');
    const base = path.basename(fileName || '', ext);
    const safeBase = this.sanitizeName(base) || 'arquivo';
    const safeExt = ext
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .slice(0, 20);

    return `${safeBase}${safeExt}`;
  }

  private storageKeyToAbsPath(storageKey: string, root = this.storageRoot) {
    const abs = path.join(root, ...storageKey.split('/'));
    this.assertSafePath(abs, root);
    return abs;
  }

  private async getEventBaseKey(eventId: number): Promise<string> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true },
    });

    if (!event) {
      throw new BadRequestException('Evento não encontrado.');
    }

    const safeName = this.sanitizeName(event.name);
    return `events/${eventId} - ${safeName}`;
  }

  private async resolveEventId(
    eventId?: number,
    parentId?: number | null,
  ): Promise<number> {
    if (eventId !== undefined && eventId !== null) {
      return eventId;
    }

    if (parentId !== undefined && parentId !== null) {
      const parent = await this.prisma.storageNode.findUnique({
        where: { id: parentId },
        select: {
          id: true,
          type: true,
          eventId: true,
        },
      });

      if (!parent) {
        throw new NotFoundException('Pasta pai não encontrada.');
      }

      if (parent.type !== 'folder') {
        throw new BadRequestException('parentId deve ser uma pasta.');
      }

      return parent.eventId;
    }

    throw new BadRequestException(
      'eventId é obrigatório quando não houver parentId.',
    );
  }

  private async getUniqueStorageKey(baseKey: string, fileName: string) {
    const ext = path.extname(fileName);
    const base = path.basename(fileName, ext);
    const maxAttempts = 100;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidateName =
        attempt === 0 ? `${base}${ext}` : `${base} (${attempt})${ext}`;
      const candidateKey = `${baseKey}/${candidateName}`;

      const exists = await this.prisma.storageNode.findFirst({
        where: { storageKey: candidateKey },
        select: { id: true },
      });

      if (!exists) {
        return {
          storageKey: candidateKey,
          finalName: candidateName,
        };
      }
    }

    throw new InternalServerErrorException(
      'Não foi possível gerar nome único para o arquivo.',
    );
  }

  private isImage(mimeType: string) {
    return mimeType.startsWith('image/');
  }

  private isVideo(mimeType: string) {
    return mimeType.startsWith('video/');
  }

  private async generateImageThumbnail(
    buffer: Buffer,
    thumbnailPath: string,
  ): Promise<void> {
    await fs.mkdir(path.dirname(thumbnailPath), { recursive: true });

    await sharp(buffer)
      .resize({ width: THUMBNAIL_SIZE, withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toFile(thumbnailPath);
  }

  private async generateVideoThumbnail(
    videoPath: string,
    thumbnailPath: string,
  ): Promise<void> {
    await fs.mkdir(path.dirname(thumbnailPath), { recursive: true });

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('error', reject)
        .on('end', () => resolve())
        .screenshots({
          timestamps: ['00:00:01'],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: `${THUMBNAIL_SIZE}x?`,
        });
    });
  }

  private thumbnailKeyFor(storageKey: string, mimeType: string): string | null {
    if (!this.isImage(mimeType) && !this.isVideo(mimeType)) {
      return null;
    }

    return `_thumbnails/${storageKey.replace(/\.[^.]+$/, '.jpg')}`;
  }

  private buildUniqueArchiveName(
    originalName: string,
    usedNames: Map<string, number>,
  ) {
    const ext = path.extname(originalName);
    const base = path.basename(originalName, ext);
    const current = usedNames.get(originalName) ?? 0;

    if (current === 0 && !usedNames.has(originalName)) {
      usedNames.set(originalName, 1);
      return originalName;
    }

    const next = current + 1;
    usedNames.set(originalName, next);
    return `${base} (${next})${ext}`;
  }

  async createFolder(body: CreateFolderInput, userId: number | null) {
    if (!body.name || typeof body.name !== 'string') {
      throw new BadRequestException('Nome da pasta inválido.');
    }

    const name = this.sanitizeName(body.name);

    if (!name) {
      throw new BadRequestException('Nome da pasta não pode ser vazio.');
    }

    const resolvedEventId = await this.resolveEventId(
      body.eventId,
      body.parentId ?? null,
    );

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
        select: {
          id: true,
          eventId: true,
          type: true,
          storageKey: true,
        },
      });

      if (!parent) {
        throw new NotFoundException('Pasta pai não encontrada.');
      }

      if (parent.eventId !== resolvedEventId) {
        throw new BadRequestException('Pasta pai não pertence a este evento.');
      }

      if (parent.type !== 'folder') {
        throw new BadRequestException('parentId precisa ser uma pasta.');
      }

      if (!parent.storageKey) {
        throw new BadRequestException(
          'Pasta pai sem storageKey (inconsistência).',
        );
      }
    }

    const baseKey = parent
      ? parent.storageKey
      : await this.getEventBaseKey(resolvedEventId);

    const storageKey = `${baseKey}/${name}`;
    this.storageKeyToAbsPath(storageKey);

    const created = await this.prisma.storageNode.create({
      data: {
        name,
        type: 'folder',
        eventId: resolvedEventId,
        parentId,
        createdById: userId ?? null,
        storageKey,
      },
      select: {
        id: true,
        name: true,
        type: true,
        eventId: true,
        parentId: true,
        updatedAt: true,
        storageKey: true,
      },
    });

    const folderPath = this.storageKeyToAbsPath(created.storageKey!);

    try {
      await fs.mkdir(folderPath, { recursive: true });
      return created;
    } catch {
      await this.prisma.storageNode
        .delete({
          where: { id: created.id },
        })
        .catch(() => {});

      throw new InternalServerErrorException('Falha ao criar pasta no disco.');
    }
  }

  async listAllFolders(eventId?: number) {
    return this.prisma.storageNode.findMany({
      where: {
        type: 'folder',
        ...(eventId !== undefined ? { eventId } : {}),
      },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        eventId: true,
        parentId: true,
        updatedAt: true,
        storageKey: true,
      },
    });
  }

  async getBreadcrumb(folderId?: number, eventId?: number) {
    if (!folderId) {
      return [];
    }

    const crumbs: { id: number; name: string }[] = [];
    let currentId: number | null = folderId;

    while (currentId !== null) {
      const node = await this.prisma.storageNode.findUnique({
        where: { id: currentId },
        select: {
          id: true,
          name: true,
          parentId: true,
          type: true,
          eventId: true,
        },
      });

      if (!node) {
        break;
      }

      if (node.type !== 'folder') {
        throw new BadRequestException('folderId deve ser uma pasta.');
      }

      if (eventId !== undefined && node.eventId !== eventId) {
        throw new BadRequestException(
          'A pasta não pertence ao evento informado.',
        );
      }

      crumbs.unshift({
        id: node.id,
        name: node.name,
      });

      currentId = node.parentId;
    }

    return crumbs;
  }

  async listItems(
    eventId?: number,
    parentId?: number | null,
    cursor?: number,
    sortField: SortField = 'name',
    sortOrder: SortOrder = 'asc',
  ) {
    if (eventId === undefined || eventId === null) {
      throw new BadRequestException('eventId é obrigatório.');
    }

    if (parentId !== null && parentId !== undefined) {
      const parent = await this.prisma.storageNode.findUnique({
        where: { id: parentId },
        select: {
          id: true,
          type: true,
          eventId: true,
        },
      });

      if (!parent) {
        throw new NotFoundException('Pasta pai não encontrada.');
      }

      if (parent.type !== 'folder') {
        throw new BadRequestException('parentId deve ser uma pasta.');
      }

      if (parent.eventId !== eventId) {
        throw new BadRequestException('A pasta pai pertence a outro evento.');
      }
    }

    const orderBy: any[] = [{ type: 'asc' }];

    if (sortField === 'name') {
      orderBy.push({ name: sortOrder });
    } else if (sortField === 'updatedAt') {
      orderBy.push({ updatedAt: sortOrder });
    } else if (sortField === 'size') {
      orderBy.push({ size: sortOrder });
    }

    orderBy.push({ id: 'asc' });

    const items = await this.prisma.storageNode.findMany({
      where: {
        eventId,
        parentId: parentId ?? null,
      },
      orderBy,
      take: PAGE_SIZE + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      select: {
        id: true,
        name: true,
        type: true,
        eventId: true,
        parentId: true,
        updatedAt: true,
        mimeType: true,
        size: true,
        thumbKey: true,
        _count: {
          select: { children: true },
        },
      },
    });

    const hasMore = items.length > PAGE_SIZE;
    const data = hasMore ? items.slice(0, PAGE_SIZE) : items;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  async uploadFile(
    eventId: number | undefined,
    parentId: number | null,
    file: Express.Multer.File,
    userId: number | null,
  ) {
    const resolvedEventId = await this.resolveEventId(eventId, parentId);

    if (!file) {
      throw new BadRequestException('Arquivo não enviado.');
    }

    let parent: {
      id: number;
      eventId: number;
      type: string;
      storageKey: string | null;
    } | null = null;

    if (parentId !== null) {
      parent = await this.prisma.storageNode.findUnique({
        where: { id: parentId },
        select: {
          id: true,
          eventId: true,
          type: true,
          storageKey: true,
        },
      });

      if (!parent) {
        throw new NotFoundException('Pasta pai não encontrada.');
      }

      if (parent.eventId !== resolvedEventId) {
        throw new BadRequestException('Pasta pai não pertence a este evento.');
      }

      if (parent.type !== 'folder') {
        throw new BadRequestException('parentId precisa ser uma pasta.');
      }

      if (!parent.storageKey) {
        throw new BadRequestException('Pasta pai sem storageKey.');
      }
    }

    const baseKey = parent
      ? parent.storageKey!
      : await this.getEventBaseKey(resolvedEventId);

    const safeFileName = this.sanitizeFileName(file.originalname);
    const { storageKey, finalName } = await this.getUniqueStorageKey(
      baseKey,
      safeFileName,
    );

    const filePath = this.storageKeyToAbsPath(storageKey);
    const fileDir = path.dirname(filePath);

    const mimeType = file.mimetype || null;
    const thumbKey = mimeType
      ? this.thumbnailKeyFor(storageKey, mimeType)
      : null;

    const created = await this.prisma.storageNode.create({
      data: {
        name: finalName,
        type: 'file',
        eventId: resolvedEventId,
        parentId,
        createdById: userId ?? null,
        storageKey,
        thumbKey,
        mimeType,
        size: file.size || null,
      },
      select: {
        id: true,
        name: true,
        type: true,
        eventId: true,
        parentId: true,
        updatedAt: true,
        mimeType: true,
        size: true,
        thumbKey: true,
        storageKey: true,
      },
    });

    try {
      await fs.mkdir(fileDir, { recursive: true });
      await fs.writeFile(filePath, file.buffer);
    } catch {
      await this.prisma.storageNode
        .delete({
          where: { id: created.id },
        })
        .catch(() => {});

      throw new InternalServerErrorException(
        'Falha ao salvar arquivo no disco.',
      );
    }

    if (thumbKey && mimeType) {
      const thumbnailPath = this.storageKeyToAbsPath(
        thumbKey.replace(/^_thumbnails\//, ''),
        this.thumbnailRoot,
      );

      if (this.isImage(mimeType)) {
        this.generateImageThumbnail(file.buffer, thumbnailPath).catch(() => {});
      } else if (this.isVideo(mimeType)) {
        this.generateVideoThumbnail(filePath, thumbnailPath).catch(() => {});
      }
    }

    return created;
  }

  async getThumbnailPath(nodeId: number): Promise<string> {
    const node = await this.prisma.storageNode.findUnique({
      where: { id: nodeId },
      select: { thumbKey: true },
    });

    if (!node?.thumbKey) {
      throw new BadRequestException('Este item não possui thumbnail.');
    }

    const thumbPath = this.storageKeyToAbsPath(
      node.thumbKey.replace(/^_thumbnails\//, ''),
      this.thumbnailRoot,
    );

    try {
      await fs.access(thumbPath);
    } catch {
      throw new BadRequestException(
        'Thumbnail ainda não gerado ou indisponível.',
      );
    }

    return thumbPath;
  }

  async getFilePath(
    nodeId: number,
  ): Promise<{ absPath: string; name: string; mimeType: string | null }> {
    const node = await this.prisma.storageNode.findUnique({
      where: { id: nodeId },
      select: {
        storageKey: true,
        name: true,
        mimeType: true,
        type: true,
      },
    });

    if (!node) {
      throw new NotFoundException('Arquivo não encontrado.');
    }

    if (node.type !== 'file') {
      throw new BadRequestException('Este item não é um arquivo.');
    }

    if (!node.storageKey) {
      throw new NotFoundException('Arquivo sem caminho físico.');
    }

    const absPath = this.storageKeyToAbsPath(node.storageKey);

    try {
      await fs.access(absPath);
    } catch {
      throw new NotFoundException('Arquivo não encontrado no disco.');
    }

    return {
      absPath,
      name: node.name,
      mimeType: node.mimeType,
    };
  }

  async downloadSelectedFilesZip(nodeIds: number[], res: Response) {
    if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
      throw new BadRequestException('Nenhum arquivo selecionado.');
    }

    const uniqueIds = Array.from(new Set(nodeIds));

    const nodes = await this.prisma.storageNode.findMany({
      where: {
        id: { in: uniqueIds },
      },
      select: {
        id: true,
        name: true,
        type: true,
        storageKey: true,
      },
    });

    if (nodes.length !== uniqueIds.length) {
      throw new NotFoundException('Um ou mais itens nÃ£o foram encontrados.');
    }

    const invalidNode = nodes.find((node) => node.type !== 'file' || !node.storageKey);

    if (invalidNode) {
      throw new BadRequestException('A seleÃ§Ã£o deve conter apenas arquivos vÃ¡lidos.');
    }

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="arquivos-selecionados.zip"',
    );
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver.default('zip', {
      zlib: { level: 9 },
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    const usedNames = new Map<string, number>();

    for (const node of nodes) {
      const filePath = this.storageKeyToAbsPath(node.storageKey!);

      if (!existsSync(filePath)) {
        continue;
      }

      const archiveName = this.buildUniqueArchiveName(node.name, usedNames);
      archive.file(filePath, { name: archiveName });
    }

    await archive.finalize();
  }

  async renameNode(nodeId: number, newName: string, _userId: number | null) {
    const node = await this.prisma.storageNode.findUnique({
      where: { id: nodeId },
      select: {
        id: true,
        name: true,
        type: true,
        storageKey: true,
        parentId: true,
        eventId: true,
      },
    });

    if (!node) {
      throw new NotFoundException('Item não encontrado.');
    }

    const sanitized =
      node.type === 'folder'
        ? this.sanitizeName(newName)
        : this.sanitizeFileName(newName);

    if (!sanitized) {
      throw new BadRequestException('Nome inválido.');
    }

    const parentKey = node.storageKey!.split('/').slice(0, -1).join('/');
    const newStorageKey = `${parentKey}/${sanitized}`;

    this.storageKeyToAbsPath(newStorageKey);

    const oldPath = this.storageKeyToAbsPath(node.storageKey!);
    const newPath = this.storageKeyToAbsPath(newStorageKey);

    await this.prisma.storageNode.update({
      where: { id: nodeId },
      data: {
        name: sanitized,
        storageKey: newStorageKey,
      },
    });

    try {
      await fs.rename(oldPath, newPath);
    } catch {
      await this.prisma.storageNode
        .update({
          where: { id: nodeId },
          data: {
            name: node.name,
            storageKey: node.storageKey!,
          },
        })
        .catch(() => {});

      throw new InternalServerErrorException('Falha ao renomear no disco.');
    }

    return {
      id: nodeId,
      name: sanitized,
      storageKey: newStorageKey,
    };
  }

  async moveNode(
    nodeId: number,
    targetParentId: number | null,
    eventId?: number,
  ) {
    const node = await this.prisma.storageNode.findUnique({
      where: { id: nodeId },
      select: {
        id: true,
        name: true,
        type: true,
        storageKey: true,
        eventId: true,
        parentId: true,
      },
    });

    if (!node) {
      throw new NotFoundException('Item não encontrado.');
    }

    const resolvedEventId = eventId ?? node.eventId;

    if (resolvedEventId !== node.eventId) {
      throw new BadRequestException(
        'Não é permitido mover itens entre eventos diferentes.',
      );
    }

    let targetBaseKey: string;

    if (targetParentId !== null) {
      if (targetParentId === nodeId) {
        throw new BadRequestException(
          'Não é possível mover uma pasta para ela mesma.',
        );
      }

      const target = await this.prisma.storageNode.findUnique({
        where: { id: targetParentId },
        select: {
          id: true,
          type: true,
          storageKey: true,
          eventId: true,
        },
      });

      if (!target) {
        throw new BadRequestException('Pasta destino não encontrada.');
      }

      if (target.type !== 'folder') {
        throw new BadRequestException('Destino precisa ser uma pasta.');
      }

      if (target.eventId !== node.eventId) {
        throw new BadRequestException(
          'Não é permitido mover itens entre eventos diferentes.',
        );
      }

      if (!target.storageKey) {
        throw new BadRequestException('Pasta destino sem storageKey.');
      }

      targetBaseKey = target.storageKey;
    } else {
      targetBaseKey = await this.getEventBaseKey(node.eventId);
    }

    const newStorageKey = `${targetBaseKey}/${node.name}`;
    this.storageKeyToAbsPath(newStorageKey);

    const oldPath = this.storageKeyToAbsPath(node.storageKey!);
    const newPath = this.storageKeyToAbsPath(newStorageKey);

    await this.prisma.storageNode.update({
      where: { id: nodeId },
      data: {
        parentId: targetParentId,
        storageKey: newStorageKey,
      },
    });

    try {
      await fs.rename(oldPath, newPath);
    } catch {
      await this.prisma.storageNode
        .update({
          where: { id: nodeId },
          data: {
            parentId: node.parentId,
            storageKey: node.storageKey!,
          },
        })
        .catch(() => {});

      throw new InternalServerErrorException('Falha ao mover no disco.');
    }

    return {
      id: nodeId,
      storageKey: newStorageKey,
    };
  }

  async deleteNode(nodeId: number) {
    const node = await this.prisma.storageNode.findUnique({
      where: { id: nodeId },
      select: {
        id: true,
        storageKey: true,
        thumbKey: true,
        type: true,
      },
    });

    if (!node) {
      throw new NotFoundException('Item não encontrado.');
    }

    const absPath = this.storageKeyToAbsPath(node.storageKey!);

    await this.prisma.storageNode.delete({
      where: { id: nodeId },
    });

    try {
      if (node.type === 'folder') {
        await fs.rm(absPath, { recursive: true, force: true });
      } else {
        await fs.unlink(absPath).catch(() => {});

        if (node.thumbKey) {
          const thumbPath = this.storageKeyToAbsPath(
            node.thumbKey.replace(/^_thumbnails\//, ''),
            this.thumbnailRoot,
          );
          await fs.unlink(thumbPath).catch(() => {});
        }
      }
    } catch {}

    return { deleted: true };
  }

  async getGlobalRoot(clientId?: number) {
    return this.prisma.event.findMany({
      where: {
        ...(clientId !== undefined ? { clientId } : {}),
      },
      orderBy: {
        date: 'asc',
      },
      select: {
        id: true,
        name: true,
        date: true,
        location: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
