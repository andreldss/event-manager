import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { Response } from 'express';
import * as archiver from 'archiver';
import { randomBytes } from 'crypto';
import { createReadStream, existsSync } from 'fs';
import { basename, join } from 'path';
import type { CreatePublicShareDto } from './dto/public-share.dto.js';

@Injectable()
export class StoragePublicService {
  constructor(private readonly prisma: PrismaService) {}

  async createPublicShare(body: CreatePublicShareDto) {
    const node = await this.prisma.storageNode.findUnique({
      where: { id: body.nodeId },
    });

    if (!node) {
      throw new NotFoundException('Pasta não encontrada.');
    }

    if (node.type !== 'folder') {
      throw new BadRequestException(
        'Apenas pastas podem ser compartilhadas publicamente.',
      );
    }

    const token = this.generatePublicShareToken();

    const share = await this.prisma.storageNodePublicShare.create({
      data: {
        nodeId: body.nodeId,
        token,
        allowDownload: body.allowDownload ?? true,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });

    return share;
  }

  async listNodePublicShares(nodeId: number) {
    const node = await this.prisma.storageNode.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      throw new NotFoundException('Pasta não encontrada.');
    }

    return this.prisma.storageNodePublicShare.findMany({
      where: { nodeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokePublicShare(shareId: number) {
    const share = await this.prisma.storageNodePublicShare.findUnique({
      where: { id: shareId },
    });

    if (!share) {
      throw new NotFoundException('Link não encontrado.');
    }

    return this.prisma.storageNodePublicShare.update({
      where: { id: shareId },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async getPublicShare(token: string) {
    const share = await this.getValidPublicShareByToken(token);

    return {
      share: {
        id: share.id,
        allowDownload: share.allowDownload,
        expiresAt: share.expiresAt,
      },
      folder: {
        id: share.node.id,
        name: share.node.name,
      },
    };
  }

  async getPublicItems(token: string, parentId?: string) {
    const share = await this.getValidPublicShareByToken(token);

    let currentFolderId = share.nodeId;

    if (parentId) {
      const parsedParentId = Number(parentId);

      if (Number.isNaN(parsedParentId)) {
        throw new BadRequestException('parentId inválido.');
      }

      await this.assertNodeInsideSharedTree(share.nodeId, parsedParentId);

      const targetFolder = await this.prisma.storageNode.findUnique({
        where: { id: parsedParentId },
      });

      if (!targetFolder) {
        throw new NotFoundException('Pasta não encontrada.');
      }

      if (targetFolder.type !== 'folder') {
        throw new BadRequestException('O parentId precisa ser uma pasta.');
      }

      currentFolderId = targetFolder.id;
    }

    const items = await this.prisma.storageNode.findMany({
      where: {
        parentId: currentFolderId,
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return {
      rootFolder: {
        id: share.node.id,
        name: share.node.name,
      },
      currentFolderId,
      allowDownload: share.allowDownload,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        mimeType: item.mimeType,
        size: item.size,
        thumbKey: item.thumbKey,
        updatedAt: item.updatedAt,
      })),
    };
  }

  async getPublicBreadcrumb(token: string, folderId?: string) {
    const share = await this.getValidPublicShareByToken(token);

    let targetFolderId = share.nodeId;

    if (folderId) {
      const parsedFolderId = Number(folderId);

      if (Number.isNaN(parsedFolderId)) {
        throw new BadRequestException('folderId inválido.');
      }

      await this.assertNodeInsideSharedTree(share.nodeId, parsedFolderId);

      const folder = await this.prisma.storageNode.findUnique({
        where: { id: parsedFolderId },
      });

      if (!folder) {
        throw new NotFoundException('Pasta não encontrada.');
      }

      if (folder.type !== 'folder') {
        throw new BadRequestException('folderId precisa ser uma pasta.');
      }

      targetFolderId = parsedFolderId;
    }

    const breadcrumb = await this.buildPublicBreadcrumb(
      share.nodeId,
      targetFolderId,
    );

    return breadcrumb;
  }

  async downloadPublicFile(token: string, fileId: number, res: Response) {
    const share = await this.getValidPublicShareByToken(token);

    if (!share.allowDownload) {
      throw new ForbiddenException('Download não permitido.');
    }

    await this.assertNodeInsideSharedTree(share.nodeId, fileId);

    const fileNode = await this.prisma.storageNode.findUnique({
      where: { id: fileId },
    });

    if (!fileNode) {
      throw new NotFoundException('Arquivo não encontrado.');
    }

    if (fileNode.type !== 'file') {
      throw new BadRequestException('O item informado não é um arquivo.');
    }

    const filePath = this.getStorageAbsolutePath(fileNode.storageKey);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Arquivo físico não encontrado.');
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileNode.name)}"`,
    );

    if (fileNode.mimeType) {
      res.setHeader('Content-Type', fileNode.mimeType);
    } else {
      res.setHeader('Content-Type', 'application/octet-stream');
    }

    const stream = createReadStream(filePath);
    stream.pipe(res);
  }

  async downloadPublicZip(token: string, res: Response) {
    const share = await this.getValidPublicShareByToken(token);

    if (!share.allowDownload) {
      throw new ForbiddenException('Download não permitido.');
    }

    const rootFolder = await this.prisma.storageNode.findUnique({
      where: { id: share.nodeId },
    });

    if (!rootFolder) {
      throw new NotFoundException('Pasta compartilhada não encontrada.');
    }

    const allNodes = await this.getAllDescendantsFromFolder(rootFolder.id);

    const zipName = `${rootFolder.name}.zip`;

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(zipName)}"`,
    );
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver.default('zip', {
      zlib: { level: 9 },
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    for (const node of allNodes) {
      if (node.type !== 'file') continue;
      if (!node.storageKey) continue;

      const filePath = this.getStorageAbsolutePath(node.storageKey);

      if (!existsSync(filePath)) continue;

      const relativePath = await this.buildRelativePathInsideSharedFolder(
        rootFolder.id,
        node.id,
      );

      archive.file(filePath, {
        name: relativePath,
      });
    }

    await archive.finalize();
  }

  async getValidPublicShareByToken(token: string) {
    const share = await this.prisma.storageNodePublicShare.findUnique({
      where: { token },
      include: {
        node: true,
      },
    });

    if (!share) {
      throw new NotFoundException('Link não encontrado.');
    }

    if (share.revokedAt) {
      throw new NotFoundException('Link não encontrado.');
    }

    if (share.expiresAt && share.expiresAt.getTime() < Date.now()) {
      throw new NotFoundException('Link não encontrado.');
    }

    if (!share.node) {
      throw new NotFoundException('Pasta não encontrada.');
    }

    if (share.node.type !== 'folder') {
      throw new BadRequestException(
        'O link público precisa apontar para uma pasta.',
      );
    }

    return share;
  }

  async assertNodeInsideSharedTree(sharedRootId: number, targetNodeId: number) {
    let currentNode = await this.prisma.storageNode.findUnique({
      where: { id: targetNodeId },
    });

    if (!currentNode) {
      throw new NotFoundException('Item não encontrado.');
    }

    while (currentNode) {
      if (currentNode.id === sharedRootId) {
        return;
      }

      if (!currentNode.parentId) {
        break;
      }

      currentNode = await this.prisma.storageNode.findUnique({
        where: { id: currentNode.parentId },
      });
    }

    throw new NotFoundException('Item não encontrado.');
  }

  async buildPublicBreadcrumb(sharedRootId: number, targetFolderId: number) {
    const result: { id: number; name: string }[] = [];

    let currentNode = await this.prisma.storageNode.findUnique({
      where: { id: targetFolderId },
    });

    while (currentNode) {
      result.push({
        id: currentNode.id,
        name: currentNode.name,
      });

      if (currentNode.id === sharedRootId) {
        break;
      }

      if (!currentNode.parentId) {
        break;
      }

      currentNode = await this.prisma.storageNode.findUnique({
        where: { id: currentNode.parentId },
      });
    }

    return result.reverse();
  }

  async getAllDescendantsFromFolder(rootFolderId: number) {
    const collected: Array<{
      id: number;
      name: string;
      type: 'folder' | 'file';
      parentId: number | null;
      storageKey: string | null;
    }> = [];

    await this.collectDescendantsRecursively(rootFolderId, collected);

    return collected;
  }

  async collectDescendantsRecursively(
    folderId: number,
    collected: Array<{
      id: number;
      name: string;
      type: 'folder' | 'file';
      parentId: number | null;
      storageKey: string | null;
    }>,
  ) {
    const children = await this.prisma.storageNode.findMany({
      where: {
        parentId: folderId,
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    for (const child of children) {
      collected.push({
        id: child.id,
        name: child.name,
        type: child.type,
        parentId: child.parentId,
        storageKey: child.storageKey ?? null,
      });

      if (child.type === 'folder') {
        await this.collectDescendantsRecursively(child.id, collected);
      }
    }
  }

  async buildRelativePathInsideSharedFolder(
    sharedRootId: number,
    fileId: number,
  ) {
    const parts: string[] = [];

    let currentNode = await this.prisma.storageNode.findUnique({
      where: { id: fileId },
    });

    if (!currentNode) {
      throw new NotFoundException('Arquivo não encontrado.');
    }

    while (currentNode) {
      if (currentNode.id === sharedRootId) {
        break;
      }

      parts.push(currentNode.name);

      if (!currentNode.parentId) {
        break;
      }

      currentNode = await this.prisma.storageNode.findUnique({
        where: { id: currentNode.parentId },
      });
    }

    return parts.reverse().join('/');
  }

  generatePublicShareToken() {
    return randomBytes(24).toString('hex');
  }

  getStorageAbsolutePath(storageKey?: string | null) {
    if (!storageKey) {
      throw new NotFoundException('Arquivo sem storageKey.');
    }

    return join('C:\\event-manager-storage', storageKey);
  }
}
