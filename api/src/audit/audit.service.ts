import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';

type AuditActorType = 'user' | 'public_share' | 'system';

type AuditContext = {
  actorType?: AuditActorType;
  actorUserId?: number | null;
  publicShareId?: number | null;
  eventId?: number | null;
  ip?: string | null;
  userAgent?: string | null;
};

type AuditPayload = {
  module: string;
  action: string;
  entityType?: string | null;
  entityId?: number | null;
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: unknown;
  actorType?: AuditActorType;
  actorUserId?: number | null;
  publicShareId?: number | null;
  eventId?: number | null;
  ip?: string | null;
  userAgent?: string | null;
};

type ListAuditLogsParams = {
  page?: number;
  pageSize?: number;
  module?: string;
  action?: string;
  entityType?: string;
  actorType?: AuditActorType;
  actorUserId?: number;
  eventId?: number;
  search?: string;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  getContextFromRequest(req?: Request & { user?: { id?: number } }): AuditContext {
    if (!req) {
      return {};
    }

    return {
      actorType: req.user?.id ? 'user' : 'system',
      actorUserId: req.user?.id ?? null,
      ip: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    };
  }

  async log(payload: AuditPayload) {
    return this.prisma.auditLog.create({
      data: {
        module: payload.module,
        action: payload.action,
        entityType: payload.entityType ?? null,
        entityId: payload.entityId ?? null,
        actorType: payload.actorType ?? 'user',
        actorUserId: payload.actorUserId ?? null,
        publicShareId: payload.publicShareId ?? null,
        eventId: payload.eventId ?? null,
        ip: payload.ip ?? null,
        userAgent: payload.userAgent ?? null,
        beforeData: payload.beforeData as any,
        afterData: payload.afterData as any,
        metadata: payload.metadata as any,
      },
    });
  }

  async list(params: ListAuditLogsParams) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(10, params.pageSize ?? 20));
    const search = params.search?.trim();

    const where = {
      ...(params.module ? { module: params.module } : {}),
      ...(params.action ? { action: params.action } : {}),
      ...(params.entityType ? { entityType: params.entityType } : {}),
      ...(params.actorType ? { actorType: params.actorType } : {}),
      ...(params.actorUserId ? { actorUserId: params.actorUserId } : {}),
      ...(params.eventId ? { eventId: params.eventId } : {}),
      ...(search
        ? {
            OR: [
              { module: { contains: search } },
              { action: { contains: search } },
              { entityType: { contains: search } },
              { ip: { contains: search } },
              {
                actorUser: {
                  is: {
                    OR: [
                      { name: { contains: search } },
                      { email: { contains: search } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          actorUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async findOne(id: number) {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        actorUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
