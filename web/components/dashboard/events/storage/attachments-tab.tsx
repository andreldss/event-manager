"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CreateFolderModal from "./create-folder-modal";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import FolderCard from "./folder-card";
import { ArrowLeft, ArrowRight, SquareArrowLeft } from "lucide-react";

type StorageNode = {
  id: number;
  name: string;
  type: "folder" | "file";
  eventId: number;
  parentId?: number | null;
  updatedAt?: string;
  mimeType?: string | null;
  size?: number | null;
  thumbKey?: string | null;
};

type PageResult = {
  data: StorageNode[];
  nextCursor: number | null;
  hasMore: boolean;
};

type BreadcrumbItem = {
  id: number;
  name: string;
};

type Props = {
  eventId: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function isImage(mimeType?: string | null) {
  return !!mimeType?.startsWith("image/");
}

function isVideo(mimeType?: string | null) {
  return !!mimeType?.startsWith("video/");
}

function formatSize(bytes?: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType?: string | null }) {
  if (isImage(mimeType)) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-9 w-9 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    );
  }

  if (isVideo(mimeType)) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-9 w-9 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 10l4.553-2.276A1 1 0 0121 8.68v6.638a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
        />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-9 w-9 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
}

function SelectionBar({
  count,
  onClear,
  onDelete,
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-background px-4 py-2.5 text-white">
      <span className="text-sm font-medium">
        {count} {count === 1 ? "selecionado" : "selecionados"}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDelete}
          className="cursor-pointer rounded-lg bg-red-500/90 px-3 py-1.5 text-xs hover:bg-red-500"
        >
          Excluir
        </button>

        <button
          type="button"
          onClick={onClear}
          className="cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
        >
          Limpar
        </button>
      </div>
    </div>
  );
}

function FileCard({
  node,
  selected,
  menuOpen,
  onToggleSelect,
  onMenuToggle,
  onRename,
  onDelete,
  onDownload,
  onPreview,
}: {
  node: StorageNode;
  selected: boolean;
  menuOpen: boolean;
  onToggleSelect: () => void;
  onMenuToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onPreview: () => void;
}) {
  const hasThumbnail = !!node.thumbKey;
  const thumbnailUrl = hasThumbnail
    ? `${API_BASE}/storage/nodes/${node.id}/thumbnail`
    : null;

  const previewable = isImage(node.mimeType);

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-white transition-all ${selected
        ? "border-background ring-2 ring-background shadow-md"
        : "border-gray-200 shadow-sm hover:shadow-md"
        }`}
    >
      <div
        className={`absolute left-2 top-2 z-20 flex h-5 w-5 items-center justify-center rounded-md border-2 bg-white transition-all cursor-pointer ${selected
          ? "border-background opacity-100"
          : "border-gray-300 opacity-0 group-hover:opacity-100"
          }`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
      >
        {selected && <span className="block h-2.5 w-2.5 rounded-sm bg-background" />}
      </div>

      <div className="absolute right-2 top-2 z-20">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-base text-gray-600 shadow-sm opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 cursor-pointer"
        >
          ···
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-30 mt-1 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              className="w-full cursor-pointer px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Baixar
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
              className="w-full cursor-pointer px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Renomear
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-full cursor-pointer px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
            >
              Excluir
            </button>
          </div>
        )}
      </div>

      <div
        className={`relative w-full bg-gray-50 ${previewable ? "cursor-pointer" : ""}`}
        style={{ aspectRatio: "4/3" }}
        onClick={() => {
          if (previewable) onPreview();
        }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={node.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileIcon mimeType={node.mimeType} />
          </div>
        )}

        {isVideo(node.mimeType) && thumbnailUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-black/50 p-2 text-white backdrop-blur-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="px-3 py-2.5">
        <p className="truncate text-sm font-medium leading-snug text-gray-800">
          {node.name}
        </p>
        {node.size != null && (
          <p className="mt-0.5 text-xs text-gray-400">{formatSize(node.size)}</p>
        )}
      </div>
    </div>
  );
}

function FolderItem({
  folder,
  selected,
  menuOpen,
  onToggleSelect,
  onMenuToggle,
  onRename,
  onDelete,
  onOpen,
}: {
  folder: StorageNode;
  selected: boolean;
  menuOpen: boolean;
  onToggleSelect: () => void;
  onMenuToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="relative">
      <div
        className={`absolute left-2 top-2 z-20 flex h-5 w-5 items-center justify-center rounded-md border-2 bg-white transition-all cursor-pointer ${selected
          ? "border-background opacity-100"
          : "border-gray-300 opacity-0 group-hover:opacity-100"
          }`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
      >
        {selected && <span className="block h-2.5 w-2.5 rounded-sm bg-background" />}
      </div>

      <div className="absolute right-3 top-3 z-20">
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-base text-gray-600 shadow-sm hover:bg-white cursor-pointer"
          >
            ···
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRename();
                }}
                className="w-full cursor-pointer px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Renomear
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="w-full cursor-pointer px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
              >
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={selected ? "rounded-xl ring-2 ring-background" : ""}>
        <FolderCard
          name={folder.name}
          updatedAt={folder.updatedAt}
          onOpen={onOpen}
        />
      </div>
    </div>
  );
}

export default function AttachmentsTab({ eventId }: Props) {
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<StorageNode[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [openCreateMenu, setOpenCreateMenu] = useState(false);
  const [openNodeMenuId, setOpenNodeMenuId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const createMenuRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFolderIdParam = searchParams.get("folderId");
  const currentFolderId = currentFolderIdParam
    ? Number(currentFolderIdParam)
    : null;

  function handleOpenFolder(folderId: number) {
    router.push(`${window.location.pathname}?tab=storage&folderId=${folderId}`);
  }

  function handleGoRoot() {
    router.push(`${window.location.pathname}?tab=storage`);
  }

  function handleGoBackFolder() {
    if (breadcrumb.length > 1) {
      const parent = breadcrumb[breadcrumb.length - 2];
      handleOpenFolder(parent.id);
      return;
    }

    handleGoRoot();
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  const fetchPage = useCallback(
    async (cursor?: number) => {
      const qs = new URLSearchParams();
      qs.set("eventId", String(eventId));
      if (currentFolderId !== null) qs.set("parentId", String(currentFolderId));
      if (cursor) qs.set("cursor", String(cursor));

      const response: PageResult = await apiFetch(
        `/storage/items?${qs.toString()}`,
        "GET",
      );

      return response;
    },
    [eventId, currentFolderId],
  );

  async function loadBreadcrumb() {
    try {
      const qs =
        currentFolderId !== null ? `?folderId=${currentFolderId}` : "";
      const result = await apiFetch(`/storage/breadcrumb${qs}`, "GET");
      setBreadcrumb(Array.isArray(result) ? result : []);
    } catch {
      setBreadcrumb([]);
    }
  }

  async function loadInitial() {
    setError("");
    setIsLoading(true);
    setItems([]);
    setNextCursor(null);
    setHasMore(false);
    setSelectedIds([]);

    try {
      const [itemsResult] = await Promise.all([fetchPage(), loadBreadcrumb()]);
      setItems(itemsResult.data);
      setNextCursor(itemsResult.nextCursor);
      setHasMore(itemsResult.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar itens.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMore() {
    if (!hasMore || !nextCursor || isFetchingMore) return;

    setIsFetchingMore(true);
    try {
      const result = await fetchPage(nextCursor);
      setItems((prev) => [...prev, ...result.data]);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao carregar mais itens.",
      );
    } finally {
      setIsFetchingMore(false);
    }
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, nextCursor, isFetchingMore, loadMore]);

  useEffect(() => {
    if (!Number.isFinite(eventId)) return;
    loadInitial();
  }, [eventId, currentFolderId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        createMenuRef.current &&
        !createMenuRef.current.contains(e.target as Node)
      ) {
        setOpenCreateMenu(false);
      }
      setOpenNodeMenuId(null);
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenCreateMenu(false);
        setOpenNodeMenuId(null);
        setLightboxIndex(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleRenameNode(node: StorageNode) {
    const newName = window.prompt("Novo nome:", node.name)?.trim();
    if (!newName || newName === node.name) {
      setOpenNodeMenuId(null);
      return;
    }

    try {
      await apiFetch(`/storage/nodes/${node.id}/rename`, "PATCH", {
        name: newName,
      });
      setOpenNodeMenuId(null);
      await loadInitial();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao renomear.");
      setOpenNodeMenuId(null);
    }
  }

  async function handleDeleteNode(node: StorageNode) {
    const label = node.type === "folder" ? "pasta" : "arquivo";
    if (!window.confirm(`Deseja excluir ${label} "${node.name}"?`)) {
      setOpenNodeMenuId(null);
      return;
    }

    try {
      await apiFetch(`/storage/nodes/${node.id}`, "DELETE");
      setOpenNodeMenuId(null);
      await loadInitial();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir.");
      setOpenNodeMenuId(null);
    }
  }

  async function handleDeleteSelected() {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Deseja excluir ${selectedIds.length} ${selectedIds.length === 1 ? "item" : "itens"
      }?`,
    );

    if (!confirmed) return;

    try {
      await Promise.all(
        selectedIds.map((id) => apiFetch(`/storage/nodes/${id}`, "DELETE")),
      );
      setSelectedIds([]);
      await loadInitial();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao excluir itens.",
      );
    }
  }

  function handleDownloadNode(node: StorageNode) {
    window.open(`${API_BASE}/storage/nodes/${node.id}/download`, "_blank");
    setOpenNodeMenuId(null);
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError("");

    try {
      const formData = new FormData();
      formData.append("eventId", String(eventId));
      if (currentFolderId !== null) {
        formData.append("parentId", String(currentFolderId));
      }

      for (const file of Array.from(files)) {
        formData.append("files", file);
      }

      const response = await fetch(`${API_BASE}/storage/files`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Falha ao enviar arquivos.");
      }

      await loadInitial();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao enviar arquivos.",
      );
    } finally {
      e.target.value = "";
    }
  }

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((i) => i.name.toLowerCase().includes(term));
  }, [items, search]);

  const folders = filteredItems.filter((i) => i.type === "folder");
  const files = filteredItems.filter((i) => i.type === "file");
  const imageFiles = files.filter((file) => isImage(file.mimeType));

  const currentLightboxFile =
    lightboxIndex !== null ? imageFiles[lightboxIndex] : null;

  const hasPrev = lightboxIndex !== null && lightboxIndex > 0;
  const hasNext =
    lightboxIndex !== null && lightboxIndex < imageFiles.length - 1;

  useEffect(() => {
    if (lightboxIndex === null) return;

    function handleLightboxKeys(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => {
          if (prev === null) return prev;
          if (prev >= imageFiles.length - 1) return prev;
          return prev + 1;
        });
      }

      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => {
          if (prev === null) return prev;
          if (prev <= 0) return prev;
          return prev - 1;
        });
      }

      if (e.key === "Escape") {
        setLightboxIndex(null);
      }
    }

    document.addEventListener("keydown", handleLightboxKeys);
    return () => {
      document.removeEventListener("keydown", handleLightboxKeys);
    };
  }, [lightboxIndex, imageFiles.length]);

  return (
    <>
      <div className="flex h-full min-h-0 w-full flex-col gap-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />

        <div className="flex w-full items-center justify-between gap-3">
          <div className="w-full max-w-xl">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nesta pasta..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div className="relative shrink-0" ref={createMenuRef}>
            <button
              type="button"
              onClick={() => setOpenCreateMenu((prev) => !prev)}
              className="cursor-pointer rounded-lg bg-background px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              + Novo
            </button>

            {openCreateMenu && (
              <div className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setOpenCreateMenu(false);
                    setOpenModal(true);
                  }}
                  className="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Nova pasta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenCreateMenu(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Adicionar arquivos
                </button>
              </div>
            )}
          </div>
        </div>

        {selectedIds.length > 0 && (
          <SelectionBar
            count={selectedIds.length}
            onClear={clearSelection}
            onDelete={handleDeleteSelected}
          />
        )}

        <div className="h-px w-full bg-gray-100" />

        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          {currentFolderId && (
            <>
              <button
                type="button"
                onClick={handleGoBackFolder}
                className="cursor-pointer rounded-md px-2 py-1 hover:bg-gray-100 hover:text-gray-800"
              >
                <SquareArrowLeft />
              </button>
              <span className="text-gray-300">|</span>
            </>
          )}

          <button
            onClick={handleGoRoot}
            className="cursor-pointer rounded-md px-2 py-1 hover:bg-gray-100 hover:text-gray-800"
          >
            Anexos
          </button>

          {breadcrumb.map((item, index) => {
            const isLast = index === breadcrumb.length - 1;

            return (
              <div key={item.id} className="flex items-center gap-2">
                <span>/</span>
                {isLast ? (
                  <span className="rounded-md px-2 py-1 font-medium text-gray-800">
                    {item.name}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenFolder(item.id)}
                    className="cursor-pointer rounded-md px-2 py-1 hover:bg-gray-100 hover:text-gray-800"
                  >
                    {item.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-gray-500">Carregando...</span>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-red-500">{error}</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-gray-500">
                Nenhum item encontrado.
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-6 py-4 px-3">
              {folders.length > 0 && (
                <section>
                  {files.length > 0 && (
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Pastas
                    </h3>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {folders.map((folder) => (
                      <div key={folder.id} className="group">
                        <FolderItem
                          folder={folder}
                          selected={selectedIds.includes(folder.id)}
                          menuOpen={openNodeMenuId === folder.id}
                          onToggleSelect={() => toggleSelect(folder.id)}
                          onMenuToggle={() =>
                            setOpenNodeMenuId((prev) =>
                              prev === folder.id ? null : folder.id,
                            )
                          }
                          onRename={() => handleRenameNode(folder)}
                          onDelete={() => handleDeleteNode(folder)}
                          onOpen={() => handleOpenFolder(folder.id)}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {files.length > 0 && (
                <section>
                  {folders.length > 0 && (
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Arquivos
                    </h3>
                  )}

                  <div className="flex flex-wrap gap-4">
                    {files.map((file) => {
                      const imageIndex = imageFiles.findIndex(
                        (image) => image.id === file.id,
                      );

                      return (
                        <div key={file.id} className="w-[180px]">
                          <FileCard
                            node={file}
                            selected={selectedIds.includes(file.id)}
                            menuOpen={openNodeMenuId === file.id}
                            onToggleSelect={() => toggleSelect(file.id)}
                            onMenuToggle={() =>
                              setOpenNodeMenuId((prev) =>
                                prev === file.id ? null : file.id,
                              )
                            }
                            onRename={() => handleRenameNode(file)}
                            onDelete={() => handleDeleteNode(file)}
                            onDownload={() => handleDownloadNode(file)}
                            onPreview={() => {
                              if (imageIndex >= 0) {
                                setLightboxIndex(imageIndex);
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <div ref={sentinelRef} className="h-1 w-full" />

              {isFetchingMore && (
                <div className="flex justify-center py-4">
                  <span className="text-sm text-gray-400">
                    Carregando mais...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <CreateFolderModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onCreated={loadInitial}
          eventId={eventId}
          parentId={currentFolderId}
        />
      </div>

      {currentLightboxFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-6 py-6"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            className="absolute right-6 top-6 cursor-pointer rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
          >
            Fechar
          </button>

          {hasPrev && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev === null ? prev : Math.max(prev - 1, 0),
                );
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            >
              <ArrowLeft />
            </button>
          )}

          {hasNext && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev === null
                    ? prev
                    : Math.min(prev + 1, imageFiles.length - 1),
                );
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            >
              <ArrowRight />
            </button>
          )}

          <div
            className="flex max-h-full max-w-full flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`${API_BASE}/storage/nodes/${currentLightboxFile.id}/raw`}
              alt={currentLightboxFile.name}
              className="max-h-[82vh] max-w-[90vw] rounded-lg object-contain"
            />

            <div className="flex items-center gap-3">
              <p className="max-w-[70vw] truncate text-sm text-white">
                {currentLightboxFile.name}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.open(
                    `${API_BASE}/storage/nodes/${currentLightboxFile.id}/download`,
                    "_blank",
                  )
                }
                className="cursor-pointer rounded-lg bg-white px-3 py-2 text-sm text-gray-800 hover:bg-gray-100"
              >
                Baixar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}