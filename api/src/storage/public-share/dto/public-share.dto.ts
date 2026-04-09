export interface CreatePublicShareDto {
  nodeId: number;
  allowDownload?: boolean;
  expiresAt?: string | null;
}
