"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CreateFolderModal from "./create-folder-modal";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import FolderCard from "./folder-card";

type StorageNode = {
  id: number;
  name: string;
  type: "folder" | "file";
  eventId: number;
  parentId?: number | null;
  updatedAt?: string;
  mimeType?: string | null;
  size?: number | null;
  thumbnailKey?: string | null;
};

type PageResult = {
  data: StorageNode[];
  nextCursor: number | null;
  hasMore: boolean;
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

function FileCard({
  node,
  onMenuToggle,
  menuOpen,
  onRename,
  onDelete,
}: {
  node: StorageNode;
  onMenuToggle: () => void;
  menuOpen: boolean;
  onRename: () => void;
  onDelete: () => void;
}) {
  const hasThumbnail = !!node.thumbnailKey;
  const thumbnailUrl = hasThumbnail
    ? `${API_BASE}/storage/nodes/${node.id}/thumbnail`
    : null;

  return (
    <div className="group relative rounded-xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative w-full bg-gray-100" style={{ aspectRatio: "16/10" }}>
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

        <div className="absolute right-2 top-2 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className="rounded-lg bg-white/90 px-2 py-1 text-sm shadow hover:bg-gray-100 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ⋯
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-36 overflow-hidden rounded-xl border bg-white shadow-lg">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRename();
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 cursor-pointer"
              >
                Renomear
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 cursor-pointer"
              >
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-3 py-2">
        <p className="truncate text-sm font-medium text-gray-800">{node.name}</p>
        {node.size != null && (
          <p className="text-xs text-gray-400">{formatSize(node.size)}</p>
        )}
      </div>
    </div>
  );
}

function FileIcon({ mimeType }: { mimeType?: string | null }) {
  if (isImage(mimeType)) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 text-gray-300"
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
        className="h-10 w-10 text-gray-300"
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
      className="h-10 w-10 text-gray-300"
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

export default function AttachmentsTab({ eventId }: Props) {
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<StorageNode[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [openCreateMenu, setOpenCreateMenu] = useState(false);
  const [openNodeMenuId, setOpenNodeMenuId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const createMenuRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFolderIdParam = searchParams.get("folderId");
  const currentFolderId = currentFolderIdParam ? Number(currentFolderIdParam) : null;

  function handleOpenFolder(folderId: number) {
    router.push(`${window.location.pathname}?tab=storage&folderId=${folderId}`);
  }

  function handleGoRoot() {
    router.push(`${window.location.pathname}?tab=storage`);
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

  async function loadInitial() {
    setError("");
    setIsLoading(true);
    setItems([]);
    setNextCursor(null);
    setHasMore(false);

    try {
      const result = await fetchPage();
      setItems(result.data);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
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
      setError(err instanceof Error ? err.message : "Falha ao carregar mais itens.");
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
  }, [hasMore, nextCursor, isFetchingMore]);

  useEffect(() => {
    if (!Number.isFinite(eventId)) return;
    loadInitial();
  }, [eventId, currentFolderId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setOpenCreateMenu(false);
      }
      setOpenNodeMenuId(null);
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenCreateMenu(false);
        setOpenNodeMenuId(null);
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

    const endpoint =
      node.type === "folder"
        ? `/storage/folders/${node.id}`
        : `/storage/files/${node.id}`;

    try {
      await apiFetch(endpoint, "PATCH", { name: newName });
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

    const endpoint =
      node.type === "folder"
        ? `/storage/folders/${node.id}`
        : `/storage/files/${node.id}`;

    try {
      await apiFetch(endpoint, "DELETE");
      setOpenNodeMenuId(null);
      await loadInitial();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir.");
      setOpenNodeMenuId(null);
    }
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError("");

    try {
      const formData = new FormData();
      formData.append("eventId", String(eventId));
      if (currentFolderId !== null)
        formData.append("parentId", String(currentFolderId));
      for (const file of Array.from(files)) formData.append("files", file)
      console.log([...formData.entries()])
      const response = await fetch(`${API_BASE}/storage/files`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(data?.message || "Falha ao enviar arquivos.");

      await loadInitial();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar arquivos.");
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

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Toolbar */}
      <div className="flex w-full items-center justify-between gap-3">
        <div className="w-full max-w-xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nesta pasta..."
            className="w-full rounded-lg border bg-gray-50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>

        <div className="relative shrink-0" ref={createMenuRef}>
          <button
            type="button"
            onClick={() => setOpenCreateMenu((prev) => !prev)}
            className="rounded-lg border bg-background px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 cursor-pointer"
          >
            + Novo
          </button>

          {openCreateMenu && (
            <div className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border bg-white shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setOpenCreateMenu(false);
                  setOpenModal(true);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 cursor-pointer"
              >
                Nova pasta
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenCreateMenu(false);
                  fileInputRef.current?.click();
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 cursor-pointer"
              >
                Adicionar arquivos
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="h-px w-full bg-gray-200" />

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <button onClick={handleGoRoot} className="hover:underline cursor-pointer">
          Anexos
        </button>
        {currentFolderId ? <span>/ Pasta {currentFolderId}</span> : null}
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
            <span className="text-sm text-gray-500">Nenhum item encontrado.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-6 pb-4">
            {folders.length > 0 && (
              <section>
                {files.length > 0 && (
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Pastas
                  </h3>
                )}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {folders.map((folder) => (
                    <div key={folder.id} className="relative">
                      <div className="absolute right-3 top-3 z-20">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenNodeMenuId((prev) =>
                                prev === folder.id ? null : folder.id,
                              );
                            }}
                            className="rounded-lg bg-white/90 px-2 py-1 text-sm shadow hover:bg-gray-100 cursor-pointer"
                          >
                            ⋯
                          </button>

                          {openNodeMenuId === folder.id && (
                            <div className="absolute right-0 top-full z-30 mt-2 w-36 overflow-hidden rounded-xl border bg-white shadow-lg">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenameNode(folder);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 cursor-pointer"
                              >
                                Renomear
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNode(folder);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 cursor-pointer"
                              >
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <FolderCard
                        name={folder.name}
                        updatedAt={folder.updatedAt}
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
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {files.map((file) => (
                    <FileCard
                      key={file.id}
                      node={file}
                      menuOpen={openNodeMenuId === file.id}
                      onMenuToggle={() =>
                        setOpenNodeMenuId((prev) =>
                          prev === file.id ? null : file.id,
                        )
                      }
                      onRename={() => handleRenameNode(file)}
                      onDelete={() => handleDeleteNode(file)}
                    />
                  ))}
                </div>
              </section>
            )}

            <div ref={sentinelRef} className="h-1 w-full" />

            {isFetchingMore && (
              <div className="flex justify-center py-4">
                <span className="text-sm text-gray-400">Carregando mais...</span>
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
  );
}