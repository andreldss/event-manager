export type StorageNode = {
  id: number;
  name: string;
  type: "folder" | "file";
  eventId?: number | null;
  parentId?: number | null;
  updatedAt?: string;
  mimeType?: string | null;
  size?: number | null;
  thumbKey?: string | null;
};

export type PageResult = {
  data: StorageNode[];
  nextCursor: number | null;
  hasMore: boolean;
};

export type BreadcrumbItem = {
  id: number;
  name: string;
};

export type UploadState =
  | { status: "idle" }
  | { status: "uploading"; total: number; fileName: string }
  | { status: "done"; total: number }
  | { status: "error"; message: string };

export type SortOption =
  | "name-asc"
  | "name-desc"
  | "updated-desc"
  | "updated-asc";

export type StorageManagerProps = {
  eventId?: number | null;
  rootLabel?: string;
  queryTab?: string;
  externalCrumb?: {
    label: string;
    currentLabel: string;
    onBack: () => void;
  };
};
