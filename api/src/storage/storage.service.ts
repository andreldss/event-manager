import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateFolderDto } from './dto/folder/create-folder.dto.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';

const THUMBNAIL_SIZE = 400;
const PAGE_SIZE = 50;

@Injectable()
export class StorageService {
  constructor(private readonly prisma: PrismaService) { }

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
    if (!event) throw new BadRequestException('Evento não encontrado.');
    const safeName = this.sanitizeName(event.name);
    return `events/${eventId} - ${safeName}`;
  }

  private async getUniqueStorageKey(baseKey: string, fileName: string) {
    const ext = path.extname(fileName);
    const base = path.basename(fileName, ext);
    const MAX = 100;

    for (let attempt = 0; attempt < MAX; attempt++) {
      const candidateName =
        attempt === 0 ? `${base}${ext}` : `${base} (${attempt})${ext}`;
      const candidateKey = `${baseKey}/${candidateName}`;

      const exists = await this.prisma.storageNode.findFirst({
        where: { storageKey: candidateKey },
        select: { id: true },
      });

      if (!exists) return { storageKey: candidateKey, finalName: candidateName };
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

  /**
   * Gera thumbnail de imagem usando sharp.
   * O original (buffer) NUNCA é alterado.
   */

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

  /**
   * Gera thumbnail do primeiro frame de um vídeo usando ffmpeg.
   * Requer ffmpeg instalado no servidor.
   */

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

  /**
   * Retorna o storageKey do thumbnail correspondente ao arquivo,
   * ou null se não for imagem/vídeo.
   */

  private thumbnailKeyFor(storageKey: string, mimeType: string): string | null {
    if (!this.isImage(mimeType) && !this.isVideo(mimeType)) return null;
    // ex: events/1 - Festa/fotos/img.jpg → _thumbnails/events/1 - Festa/fotos/img.jpg
    return `_thumbnails/${storageKey.replace(/\.[^.]+$/, '.jpg')}`;
  }

  async createFolder(body: CreateFolderDto, userId: number | null) {
    if (!body.name || typeof body.name !== 'string')
      throw new BadRequestException('Nome da pasta inválido.');

    const name = this.sanitizeName(body.name);
    if (!name) throw new BadRequestException('Nome da pasta não pode ser vazio.');

    if (!body.eventId || typeof body.eventId !== 'number')
      throw new BadRequestException('EventId inválido.');

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
        throw new BadRequestException('Pasta pai sem storageKey (inconsistência).');
    }

    const baseKey = parent
      ? (parent.storageKey as string)
      : await this.getEventBaseKey(body.eventId);

    const storageKey = `${baseKey}/${name}`;

    this.storageKeyToAbsPath(storageKey);

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

    const folderPath = this.storageKeyToAbsPath(created.storageKey!);

    try {
      await fs.mkdir(folderPath, { recursive: true });
      return created;
    } catch {
      await this.prisma.storageNode.delete({ where: { id: created.id } }).catch(() => { });
      throw new InternalServerErrorException('Falha ao criar pasta no disco.');
    }
  }

  async listFolders(eventId: number, parentId: number | null) {
    return this.prisma.storageNode.findMany({
      where: { eventId, parentId, type: 'folder' },
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

  async uploadFile(
    eventId: number,
    parentId: number | null,
    file: Express.Multer.File,
    userId: number | null,
  ) {
    if (!eventId || typeof eventId !== 'number')
      throw new BadRequestException('EventId inválido.');
    if (!file) throw new BadRequestException('Arquivo não enviado.');

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
      if (parent.eventId !== eventId)
        throw new BadRequestException('Pasta pai não pertence a este evento.');
      if (parent.type !== 'folder')
        throw new BadRequestException('parentId precisa ser uma pasta.');
      if (!parent.storageKey)
        throw new BadRequestException('Pasta pai sem storageKey.');
    }

    const baseKey = parent
      ? parent.storageKey!
      : await this.getEventBaseKey(eventId);

    const safeFileName = this.sanitizeFileName(file.originalname);
    const { storageKey, finalName } = await this.getUniqueStorageKey(baseKey, safeFileName);

    const filePath = this.storageKeyToAbsPath(storageKey);
    const fileDir = path.dirname(filePath);

    const mimeType = file.mimetype || null;
    const thumbKey = mimeType ? this.thumbnailKeyFor(storageKey, mimeType) : null;

    const created = await this.prisma.storageNode.create({
      data: {
        name: finalName,
        type: 'file',
        eventId,
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
      },
    });

    try {
      await fs.mkdir(fileDir, { recursive: true });
      await fs.writeFile(filePath, file.buffer);
    } catch {
      await this.prisma.storageNode.delete({ where: { id: created.id } }).catch(() => { });
      throw new InternalServerErrorException('Falha ao salvar arquivo no disco.');
    }

    if (thumbKey && mimeType) {
      const thumbnailPath = this.storageKeyToAbsPath(
        thumbKey.replace(/^_thumbnails\//, ''),
        this.thumbnailRoot,
      );

      if (this.isImage(mimeType)) {
        this.generateImageThumbnail(file.buffer, thumbnailPath).catch(() => { });
      } else if (this.isVideo(mimeType)) {
        // O vídeo já está no disco neste ponto
        this.generateVideoThumbnail(filePath, thumbnailPath).catch(() => { });
      }
    }

    return created;
  }

  async listItems(
    eventId: number,
    parentId: number | null,
    cursor?: number,
  ) {
    const items = await this.prisma.storageNode.findMany({
      where: { eventId, parentId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }, { id: 'asc' }],
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
      },
    });

    const hasMore = items.length > PAGE_SIZE;
    const data = hasMore ? items.slice(0, PAGE_SIZE) : items;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data, nextCursor, hasMore };
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
      throw new BadRequestException('Thumbnail ainda não gerado ou indisponível.');
    }

    return thumbPath;
  }
}