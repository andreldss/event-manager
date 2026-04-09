import type { SortOption, StorageNode } from "@/types/storage";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function isImage(mimeType?: string | null) {
  return !!mimeType?.startsWith("image/");
}

export function isVideo(mimeType?: string | null) {
  return !!mimeType?.startsWith("video/");
}

export function formatSize(bytes?: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function filterItems(items: StorageNode[], search: string) {
  const term = search.trim().toLowerCase();

  if (!term) return items;

  return items.filter((item) => item.name.toLowerCase().includes(term));
}

export function sortItems(items: StorageNode[], sortBy: SortOption) {
  const list = [...items];

  list.sort((a, b) => {
    if (sortBy === "name-asc") {
      return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
    }

    if (sortBy === "name-desc") {
      return b.name.localeCompare(a.name, "pt-BR", { sensitivity: "base" });
    }

    if (sortBy === "updated-desc") {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    }

    if (sortBy === "updated-asc") {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return aTime - bTime;
    }

    return 0;
  });

  return list;
}
