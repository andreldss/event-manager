import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

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

  private storageRoot =
    process.env.STORAGE_ROOT ?? 'C:\\event-manager-storage\\events';

  private sanitizeFileName(name: string) {
    return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim();
  }

  private async ensureDir(dirPath: string) {
    await fs.mkdir(dirPath, { recursive: true });
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

  private async getNodeOrThrow(id: number) {
    const node = await this.prisma.storageNode.findUnique({
      where: { id },
    });

    if (!node) {
      throw new NotFoundException('Item não encontrado.');
    }

    return node;
  }

  async createFolder(body: CreateFolderInput, userId: number | null) {
    const name = this.sanitizeFileName(body.name || '');

    if (!name) {
      throw new BadRequestException('Nome da pasta é obrigatório.');
    }

    const resolvedEventId = await this.resolveEventId(
      body.eventId,
      body.parentId ?? null,
    );

    if (body.parentId) {
      const parent = await this.prisma.storageNode.findUnique({
        where: { id: body.parentId },
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

      if (parent.eventId !== resolvedEventId) {
        throw new BadRequestException('A pasta pai pertence a outro evento.');
      }
    }

    return this.prisma.storageNode.create({
      data: {
        name,
        type: 'folder',
        eventId: resolvedEventId,
        parentId: body.parentId ?? null,
        createdById: userId,
      },
    });
  }

  async listAllFolders(eventId?: number) {
    return this.prisma.storageNode.findMany({
      where: {
        type: 'folder',
        ...(eventId !== undefined ? { eventId } : {}),
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        eventId: true,
        parentId: true,
        updatedAt: true,
      },
    });
  }

  async getBreadcrumb(folderId?: number, eventId?: number) {
    if (!folderId) {
      return [];
    }

    const breadcrumb: { id: number; name: string }[] = [];

    let current = await this.prisma.storageNode.findUnique({
      where: { id: folderId },
      select: {
        id: true,
        name: true,
        parentId: true,
        type: true,
        eventId: true,
      },
    });

    if (!current) {
      throw new NotFoundException('Pasta não encontrada.');
    }

    if (current.type !== 'folder') {
      throw new BadRequestException('folderId deve ser uma pasta.');
    }

    if (eventId !== undefined && current.eventId !== eventId) {
      throw new BadRequestException(
        'A pasta não pertence ao evento informado.',
      );
    }

    while (current) {
      breadcrumb.unshift({
        id: current.id,
        name: current.name,
      });

      if (!current.parentId) {
        break;
      }

      current = await this.prisma.storageNode.findUnique({
        where: { id: current.parentId },
        select: {
          id: true,
          name: true,
          parentId: true,
          type: true,
          eventId: true,
        },
      });

      if (!current) {
        break;
      }
    }

    return breadcrumb;
  }

  async listItems(
    eventId?: number,
    parentId?: number | null,
    cursor?: number,
    sortField: SortField = 'name',
    sortOrder: SortOrder = 'asc',
  ) {
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

      if (eventId !== undefined && parent.eventId !== eventId) {
        throw new BadRequestException('A pasta pai pertence a outro evento.');
      }
    }

    const orderBy =
      sortField === 'name'
        ? { name: sortOrder }
        : sortField === 'size'
          ? { size: sortOrder }
          : { updatedAt: sortOrder };

    const take = 25;

    const items = await this.prisma.storageNode.findMany({
      where: {
        parentId: parentId ?? null,
        ...(eventId !== undefined ? { eventId } : {}),
      },
      orderBy,
      take,
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
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

    const hasMore = items.length === take;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return {
      data: items,
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

    if (parentId) {
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

      if (parent.eventId !== resolvedEventId) {
        throw new BadRequestException('A pasta pai pertence a outro evento.');
      }
    }

    const safeName = this.sanitizeFileName(file.originalname);
    const tempNode = await this.prisma.storageNode.create({
      data: {
        name: safeName,
        type: 'file',
        eventId: resolvedEventId,
        parentId,
        mimeType: file.mimetype,
        size: file.size,
        createdById: userId,
      },
    });

    const ext = path.extname(safeName);
    const eventDir = path.join(
      this.storageRoot,
      String(resolvedEventId),
      'files',
    );
    await this.ensureDir(eventDir);

    const absPath = path.join(eventDir, `${tempNode.id}${ext}`);
    await fs.writeFile(absPath, file.buffer);

    const storageKey = path.relative(this.storageRoot, absPath);

    return this.prisma.storageNode.update({
      where: { id: tempNode.id },
      data: {
        storageKey,
      },
    });
  }

  async getThumbnailPath(id: number) {
    const node = await this.prisma.storageNode.findUnique({
      where: { id },
      select: {
        id: true,
        thumbKey: true,
      },
    });

    if (!node) {
      throw new NotFoundException('Arquivo não encontrado.');
    }

    if (!node.thumbKey) {
      throw new NotFoundException('Thumbnail não encontrada.');
    }

    return path.join(this.storageRoot, node.thumbKey);
  }

  async getFilePath(id: number) {
    const node = await this.prisma.storageNode.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        storageKey: true,
        mimeType: true,
      },
    });

    if (!node) {
      throw new NotFoundException('Arquivo não encontrado.');
    }

    if (!node.storageKey) {
      throw new NotFoundException('Arquivo sem caminho físico.');
    }

    const absPath = path.join(this.storageRoot, node.storageKey);

    return {
      absPath,
      name: node.name,
      mimeType: node.mimeType,
    };
  }

  async renameNode(id: number, name: string, _userId: number | null) {
    const node = await this.getNodeOrThrow(id);
    const safeName = this.sanitizeFileName(name);

    if (!safeName) {
      throw new BadRequestException('Nome inválido.');
    }

    return this.prisma.storageNode.update({
      where: { id },
      data: {
        name: safeName,
      },
    });
  }

  async moveNode(id: number, targetParentId: number | null, eventId?: number) {
    const node = await this.prisma.storageNode.findUnique({
      where: { id },
      select: {
        id: true,
        eventId: true,
        parentId: true,
        type: true,
      },
    });

    if (!node) {
      throw new NotFoundException('Item não encontrado.');
    }

    let resolvedEventId = node.eventId;

    if (eventId !== undefined && eventId !== null) {
      resolvedEventId = eventId;
    }

    if (targetParentId !== null) {
      const targetParent = await this.prisma.storageNode.findUnique({
        where: { id: targetParentId },
        select: {
          id: true,
          type: true,
          eventId: true,
        },
      });

      if (!targetParent) {
        throw new NotFoundException('Pasta de destino não encontrada.');
      }

      if (targetParent.type !== 'folder') {
        throw new BadRequestException('targetParentId deve ser uma pasta.');
      }

      if (targetParent.eventId !== node.eventId) {
        throw new BadRequestException(
          'Não é permitido mover itens entre eventos diferentes.',
        );
      }

      resolvedEventId = targetParent.eventId;
    }

    if (resolvedEventId !== node.eventId) {
      throw new BadRequestException(
        'Não é permitido mover itens entre eventos diferentes.',
      );
    }

    return this.prisma.storageNode.update({
      where: { id },
      data: {
        parentId: targetParentId,
      },
    });
  }

  async deleteNode(id: number) {
    const node = await this.getNodeOrThrow(id);

    if (node.type === 'folder') {
      const children = await this.prisma.storageNode.findMany({
        where: {
          parentId: id,
        },
        select: {
          id: true,
        },
      });

      for (const child of children) {
        await this.deleteNode(child.id);
      }
    }

    if (node.storageKey) {
      const absPath = path.join(this.storageRoot, node.storageKey);
      await fs.unlink(absPath).catch(() => null);
    }

    if (node.thumbKey) {
      const thumbPath = path.join(this.storageRoot, node.thumbKey);
      await fs.unlink(thumbPath).catch(() => null);
    }

    await this.prisma.storageNode.delete({
      where: { id },
    });

    return { message: 'Item excluído com sucesso.' };
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
