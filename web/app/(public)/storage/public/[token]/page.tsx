"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import StorageBreadcrumb from "@/components/dashboard/storage/storage-breadcrumb";
import StorageEmptyState from "@/components/dashboard/storage/storage-empty-state";
import StorageLightbox from "@/components/dashboard/storage/storage-lightbox";
import StorageSections from "@/components/dashboard/storage/storage-sections";
import StorageSelectionBar from "@/components/dashboard/storage/storage-selection-bar";
import StorageUploadProgressBar from "@/components/dashboard/storage/storage-upload-progress-bar";
import type {
  BreadcrumbItem,
  SortOption,
  StorageNode,
  UploadState,
} from "@/types/storage";
import {
  filterItems,
  isImage,
  sortItems,
} from "@/components/dashboard/storage/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type PublicShareResponse = {
  share: {
    id: number;
    allowDownload: boolean;
    allowUpload: boolean;
    allowCreateFolders: boolean;
    expiresAt: string | null;
  };
  folder: {
    id: number;
    name: string;
  };
};

type PublicItemsResponse = {
  rootFolder: {
    id: number;
    name: string;
  };
  currentFolderId: number;
  allowDownload: boolean;
  allowUpload: boolean;
  allowCreateFolders: boolean;
  items: StorageNode[];
};

function formatDate(date?: string | null) {
  if (!date) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function PublicStoragePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = String(params.token);
  const currentFolderIdParam = searchParams.get("folderId");
  const currentFolderId = currentFolderIdParam
    ? Number(currentFolderIdParam)
    : null;

  const [shareData, setShareData] = useState<PublicShareResponse | null>(null);
  const [itemsData, setItemsData] = useState<PublicItemsResponse | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [loading, setLoading] = useState(true);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [folderName, setFolderName] = useState("");
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const createMenuRef = useRef<HTMLDivElement | null>(null);
  const filesGridRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const uploadDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipClearSelectionOnClickRef = useRef(false);

  const canDownload = shareData?.share.allowDownload ?? false;
  const canUpload = shareData?.share.allowUpload ?? false;
  const canCreateFolders = shareData?.share.allowCreateFolders ?? false;

  const filteredItems = useMemo(
    () => filterItems(itemsData?.items ?? [], search),
    [itemsData?.items, search],
  );
  const sortedItems = useMemo(
    () => sortItems(filteredItems, sortBy),
    [filteredItems, sortBy],
  );

  const folders = sortedItems.filter((item) => item.type === "folder");
  const files = sortedItems.filter((item) => item.type === "file");
  const imageFiles = files.filter((file) => isImage(file.mimeType));
  const currentLightboxFile =
    lightboxIndex !== null ? imageFiles[lightboxIndex] : null;
  const hasPrev = lightboxIndex !== null && lightboxIndex > 0;
  const hasNext =
    lightboxIndex !== null && lightboxIndex < imageFiles.length - 1;

  function buildRoute(folderId?: number | null) {
    if (!folderId) {
      return `/storage/public/${token}`;
    }

    return `/storage/public/${token}?folderId=${folderId}`;
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [shareRes, itemsRes, breadcrumbRes] = await Promise.all([
        fetch(`${API_BASE}/storage/public/${token}`),
        fetch(
          currentFolderId
            ? `${API_BASE}/storage/public/${token}/items?parentId=${currentFolderId}`
            : `${API_BASE}/storage/public/${token}/items`,
        ),
        fetch(
          currentFolderId
            ? `${API_BASE}/storage/public/${token}/breadcrumb?folderId=${currentFolderId}`
            : `${API_BASE}/storage/public/${token}/breadcrumb`,
        ),
      ]);

      if (!shareRes.ok) {
        throw new Error("Link inválido, expirado ou revogado.");
      }

      if (!itemsRes.ok) {
        throw new Error("Não foi possível carregar os itens.");
      }

      if (!breadcrumbRes.ok) {
        throw new Error("Não foi possível carregar o caminho da pasta.");
      }

      const shareJson = (await shareRes.json()) as PublicShareResponse;
      const itemsJson = (await itemsRes.json()) as PublicItemsResponse;
      const breadcrumbJson = (await breadcrumbRes.json()) as BreadcrumbItem[];

      setShareData(shareJson);
      setItemsData(itemsJson);
      setBreadcrumb(Array.isArray(breadcrumbJson) ? breadcrumbJson : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar pasta pública.",
      );
    } finally {
      setLoading(false);
    }
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  }

  function handleOpenFolder(folderId: number) {
    router.push(buildRoute(folderId));
  }

  function handleGoRoot() {
    router.push(buildRoute(null));
  }

  function handleGoBack() {
    if (breadcrumb.length > 1) {
      const previous = breadcrumb[breadcrumb.length - 2];
      router.push(buildRoute(previous.id));
      return;
    }

    handleGoRoot();
  }

  function handleDownloadFile(fileId: number) {
    window.open(
      `${API_BASE}/storage/public/${token}/files/${fileId}/download`,
      "_blank",
    );
  }

  function handleDownloadSelected() {
    if (!canDownload || selectedIds.length === 0) return;

    void (async () => {
      try {
        const response = await fetch(
          `${API_BASE}/storage/public/${token}/download-zip`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ nodeIds: selectedIds }),
          },
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message || "Falha ao baixar arquivos.");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "arquivos-selecionados.zip";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao baixar arquivos.");
      }
    })();
  }

  function handleDownloadZip() {
    setDownloadingZip(true);
    window.open(`${API_BASE}/storage/public/${token}/download-zip`, "_blank");

    setTimeout(() => {
      setDownloadingZip(false);
    }, 1000);
  }

  async function handleCreateFolder() {
    const name = folderName.trim();
    if (!name) return;

    setCreatingFolder(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/storage/public/${token}/folder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          parentId: currentFolderId ?? undefined,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Falha ao criar pasta.");
      }

      setFolderName("");
      setCreateFolderModalOpen(false);
      clearSelection();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar pasta.");
    } finally {
      setCreatingFolder(false);
    }
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadDismissTimer.current) {
      clearTimeout(uploadDismissTimer.current);
    }

    const total = files.length;
    const firstName = files[0].name;

    setUploading(true);
    setError("");
    setUploadState({
      status: "uploading",
      total,
      fileName: total > 1 ? `${firstName} e mais ${total - 1}` : firstName,
    });

    try {
      const formData = new FormData();

      if (currentFolderId !== null) {
        formData.append("parentId", String(currentFolderId));
      }

      for (const file of Array.from(files)) {
        formData.append("files", file);
      }

      const response = await fetch(`${API_BASE}/storage/public/${token}/files`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Falha ao enviar arquivos.");
      }

      setUploadState({ status: "done", total });
      clearSelection();
      await loadData();

      uploadDismissTimer.current = setTimeout(
        () => setUploadState({ status: "idle" }),
        3000,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao enviar arquivos.";
      setError(message);
      setUploadState({
        status: "error",
        message,
      });

      uploadDismissTimer.current = setTimeout(
        () => setUploadState({ status: "idle" }),
        4000,
      );
    } finally {
      e.target.value = "";
      setUploading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token, currentFolderIdParam]);

  useEffect(() => {
    clearSelection();
    setSelectionBox(null);
    setIsDraggingSelection(false);
  }, [currentFolderIdParam]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    function handleKeys(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev === null || prev >= imageFiles.length - 1 ? prev : prev + 1,
        );
      }

      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev === null || prev <= 0 ? prev : prev - 1,
        );
      }

      if (e.key === "Escape") {
        setLightboxIndex(null);
      }
    }

    document.addEventListener("keydown", handleKeys);
    return () => document.removeEventListener("keydown", handleKeys);
  }, [lightboxIndex, imageFiles.length]);

  useEffect(() => {
    function handleDocumentClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const clickedFileCard = target.closest("[data-file-card='true']");
      const clickedToolbar =
        target.closest("input") ||
        target.closest("select") ||
        target.closest("button") ||
        target.closest("label");

      if (createMenuRef.current && !createMenuRef.current.contains(target)) {
        setCreateMenuOpen(false);
      }

      if (
        selectedIds.length > 0 &&
        !skipClearSelectionOnClickRef.current &&
        !clickedFileCard &&
        !clickedToolbar
      ) {
        clearSelection();
      }

      if (skipClearSelectionOnClickRef.current) {
        skipClearSelectionOnClickRef.current = false;
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setCreateMenuOpen(false);
        setCreateFolderModalOpen(false);
        setSelectionBox(null);
        setIsDraggingSelection(false);
        clearSelection();
      }
    }

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [selectedIds.length]);

  useEffect(() => {
    if (!isDraggingSelection) return;

    function handleMouseMove(e: MouseEvent) {
      const container = filesGridRef.current;
      const start = dragStartRef.current;
      if (!container || !start) return;

      const rect = container.getBoundingClientRect();
      const currentX = e.clientX - rect.left + container.scrollLeft;
      const currentY = e.clientY - rect.top + container.scrollTop;

      setSelectionBox({
        x: Math.min(start.x, currentX),
        y: Math.min(start.y, currentY),
        width: Math.abs(currentX - start.x),
        height: Math.abs(currentY - start.y),
      });
    }

    function handleMouseUp() {
      const container = filesGridRef.current;

      if (!container || !selectionBox) {
        setIsDraggingSelection(false);
        dragStartRef.current = null;
        setSelectionBox(null);
        return;
      }

      const GRID_PADDING = 24;
      const cards = Array.from(
        container.querySelectorAll("[data-file-card='true']"),
      ) as HTMLElement[];

      const selectedFromDrag: number[] = [];

      for (const card of cards) {
        const left = card.offsetLeft + GRID_PADDING;
        const top = card.offsetTop + GRID_PADDING;

        const intersects =
          selectionBox.x < left + card.offsetWidth &&
          selectionBox.x + selectionBox.width > left &&
          selectionBox.y < top + card.offsetHeight &&
          selectionBox.y + selectionBox.height > top;

        if (intersects) {
          const id = Number(card.dataset.fileId);
          if (!Number.isNaN(id)) {
            selectedFromDrag.push(id);
          }
        }
      }

      if (selectedFromDrag.length > 0) {
        skipClearSelectionOnClickRef.current = true;
        setSelectedIds((prev) =>
          Array.from(new Set([...prev, ...selectedFromDrag])),
        );
      }

      setIsDraggingSelection(false);
      dragStartRef.current = null;
      setSelectionBox(null);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingSelection, selectionBox]);

  const capabilityText = [
    canDownload ? "Download" : "Somente visualização",
    canUpload ? "upload" : null,
    canCreateFolders ? "criar pastas" : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-6 lg:px-6">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin text-slate-600" />
                Carregando...
              </div>
            ) : error && !shareData ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : shareData ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Pasta Compartilhada
                    </p>
                    <h1 className="mt-1 text-xl font-semibold text-slate-900">
                      {shareData.folder.name}
                    </h1>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>{capabilityText}</span>
                      <span>
                        {shareData.share.expiresAt
                          ? `Expira em ${formatDate(shareData.share.expiresAt)}`
                          : "Nunca expira"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {(canUpload || canCreateFolders) && (
                      <div className="relative" ref={createMenuRef}>
                        <button
                          type="button"
                          onClick={() => setCreateMenuOpen((prev) => !prev)}
                          className="h-10 cursor-pointer rounded-xl bg-background px-4 text-sm font-semibold text-white transition hover:bg-gray-700"
                        >
                          + Novo
                        </button>

                        {createMenuOpen && (
                          <div className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                            {canCreateFolders && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCreateMenuOpen(false);
                                  setCreateFolderModalOpen(true);
                                }}
                                className="w-full cursor-pointer px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                              >
                                Nova pasta
                              </button>
                            )}

                            {canUpload && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCreateMenuOpen(false);
                                  fileInputRef.current?.click();
                                }}
                                className="w-full cursor-pointer px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                              >
                                Adicionar arquivos
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {canDownload && (
                      <button
                        type="button"
                        onClick={handleDownloadZip}
                        disabled={downloadingZip}
                        className="h-10 cursor-pointer rounded-xl bg-background px-4 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadingZip ? "Baixando..." : "Baixar ZIP"}
                      </button>
                    )}
                  </div>
                </div>

                {canUpload && <StorageUploadProgressBar state={uploadState} />}
              </div>
            ) : null}
          </div>

          {!loading && shareData && (
            <>
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-4 py-3">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex w-full max-w-xl gap-3">
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Buscar nesta pasta..."
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                        />

                        <div className="shrink-0">
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
                          >
                            <option value="name-asc">Nome (A-Z)</option>
                            <option value="name-desc">Nome (Z-A)</option>
                            <option value="updated-desc">Mais recentes</option>
                            <option value="updated-asc">Mais antigos</option>
                          </select>
                        </div>
                      </div>

                      {selectedIds.length > 0 && (
                        <StorageSelectionBar
                          count={selectedIds.length}
                          onClear={clearSelection}
                          onDownload={canDownload ? handleDownloadSelected : undefined}
                          showDownload={canDownload}
                          showDelete={false}
                          showMove={false}
                        />
                      )}
                    </div>

                    <div className="h-px w-full bg-slate-100" />

                    <StorageBreadcrumb
                      currentFolderId={currentFolderId}
                      breadcrumb={breadcrumb}
                      rootLabel="Anexos"
                      onGoBackFolder={handleGoBack}
                      onGoRoot={handleGoRoot}
                      onOpenFolder={handleOpenFolder}
                    />
                  </div>
                </div>

                <div className="min-h-[420px]">
                  {filteredItems.length === 0 ? (
                    <div className="flex h-[320px] items-center justify-center px-6">
                      <StorageEmptyState />
                    </div>
                  ) : (
                    <StorageSections
                      folders={folders}
                      files={files}
                      imageFiles={imageFiles}
                      selectedIds={selectedIds}
                      filesGridRef={filesGridRef}
                      selectionBox={selectionBox}
                      showActions={false}
                      resolveThumbnailUrl={(file) =>
                        file.thumbKey
                          ? `${API_BASE}/storage/public/${token}/files/${file.id}/thumbnail`
                          : null
                      }
                      onOpenFolder={handleOpenFolder}
                      onToggleSelect={toggleSelect}
                      onDownload={(file) => handleDownloadFile(file.id)}
                      onPreview={(index) => setLightboxIndex(index)}
                      onFilesMouseDown={(e) => {
                        if (e.button !== 0) return;
                        if ((e.target as HTMLElement).closest("button")) return;
                        if (
                          (e.target as HTMLElement).closest("[data-file-card='true']")
                        ) {
                          return;
                        }
                        if (e.ctrlKey || e.metaKey) return;

                        e.preventDefault();

                        const container = filesGridRef.current;
                        if (!container) return;

                        const rect = container.getBoundingClientRect();
                        const startX = e.clientX - rect.left + container.scrollLeft;
                        const startY = e.clientY - rect.top + container.scrollTop;

                        dragStartRef.current = { x: startX, y: startY };
                        setSelectionBox({
                          x: startX,
                          y: startY,
                          width: 0,
                          height: 0,
                        });
                        setIsDraggingSelection(true);
                      }}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <StorageLightbox
        file={currentLightboxFile}
        imageUrl={
          currentLightboxFile
            ? `${API_BASE}/storage/public/${token}/files/${currentLightboxFile.id}/raw`
            : undefined
        }
        canDownload={canDownload}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onClose={() => setLightboxIndex(null)}
        onPrev={() =>
          setLightboxIndex((prev) =>
            prev === null ? prev : Math.max(prev - 1, 0),
          )
        }
        onNext={() =>
          setLightboxIndex((prev) =>
            prev === null ? prev : Math.min(prev + 1, imageFiles.length - 1),
          )
        }
        onDownload={() => {
          if (currentLightboxFile) {
            handleDownloadFile(currentLightboxFile.id);
          }
        }}
      />

      {createFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (!creatingFolder) {
                setCreateFolderModalOpen(false);
                setFolderName("");
              }
            }}
          />

          <div className="relative w-[560px] max-w-[92vw] rounded-xl bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Nova pasta</h2>

              <button
                type="button"
                onClick={() => {
                  if (!creatingFolder) {
                    setCreateFolderModalOpen(false);
                    setFolderName("");
                  }
                }}
                className="rounded p-1 text-slate-600 transition hover:bg-slate-100"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-900">Nome</span>
                <input
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Ex: Financeiro, Fotos..."
                  disabled={creatingFolder}
                />
              </div>

              <div className="mt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!creatingFolder) {
                      setCreateFolderModalOpen(false);
                      setFolderName("");
                    }
                  }}
                  className="rounded-lg border bg-white px-4 py-2 font-semibold transition hover:bg-slate-50"
                  disabled={creatingFolder}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleCreateFolder}
                  className="cursor-pointer rounded-lg bg-background px-4 py-2 font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={creatingFolder || !folderName.trim()}
                >
                  {creatingFolder ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
