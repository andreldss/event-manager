export interface CreatePublicShareDto {
  nodeId: number;
  allowDownload?: boolean;
  allowUpload?: boolean;
  allowCreateFolders?: boolean;
  expiresAt?: string | null;
}
