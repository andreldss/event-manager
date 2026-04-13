export type AuditActorType = "user" | "public_share" | "system";

export type AuditListItem = {
    id: number;
    module: string;
    action: string;
    entityType: string | null;
    entityId: number | null;
    actorType: AuditActorType;
    actorUserId: number | null;
    publicShareId: number | null;
    eventId: number | null;
    ip: string | null;
    userAgent: string | null;
    createdAt: string;
    actorUser?: {
        id: number;
        name: string;
        email: string;
    } | null;
};

export type AuditDetail = AuditListItem & {
    beforeData: unknown;
    afterData: unknown;
    metadata: unknown;
};

export type AuditListResponse = {
    items: AuditListItem[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
};