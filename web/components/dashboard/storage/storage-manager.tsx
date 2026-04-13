"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

import CreateFolderModal from "./create-folder-modal";
import RenameNodeModal from "./rename-files-modal";
import SharePublicLinkModal from "./share-public-link-modal";
import MoveSelectedNodesModal from "./move-selected-nodes-modal";

import StorageToolbar from "./storage-toolbar";
import StorageBreadcrumb from "./storage-breadcrumb";
import StorageUploadProgressBar from "./storage-upload-progress-bar";
import StorageLoadingState from "./storage-loading-state";
import StorageErrorState from "./storage-error-state";
import StorageEmptyState from "./storage-empty-state";
import StorageSections from "./storage-sections";
import StorageLightbox from "./storage-lightbox";

import type {
  BreadcrumbItem,
  PageResult,
  SortOption,
  StorageManagerProps,
  StorageNode,
  UploadState,
} from "@/types/storage";

import { API_BASE, filterItems, isImage, sortItems } from "./utils";

export default function StorageManager({
  eventId = null,
  rootLabel = "Anexos",
  queryTab,
  externalCrumb,
}: StorageManagerProps) {
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
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameNodeId, setRenameNodeId] = useState<number | null>(null);
  const [renameNodeName, setRenameNodeName] = useState("");
  const [renameNodeType, setRenameNodeType] = useState<
    "folder" | "file" | null
  >(null);
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareNodeId, setShareNodeId] = useState<number | null>(null);
  const [shareFolderName, setShareFolderName] = useState("");
  const [moveModalOpen, setMoveModalOpen] = useState(false);

  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const createMenuRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const filesGridRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const uploadDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipClearSelectionOnClickRef = useRef(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentFolderIdParam = searchParams.get("folderId");
  const currentFolderId = currentFolderIdParam
    ? Number(currentFolderIdParam)
    : null;

  function buildRoute(folderId?: number | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (queryTab) {
      params.set("tab", queryTab);
    }

    if (folderId !== null && folderId !== undefined) {
      params.set("folderId", String(folderId));
    } else {
      params.delete("folderId");
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function handleOpenFolder(folderId: number) {
    router.push(buildRoute(folderId));
  }

  function handleGoRoot() {
    router.push(buildRoute(null));
  }

  function handleGoBackFolder() {
    if (breadcrumb.length > 1) {
      handleOpenFolder(breadcrumb[breadcrumb.length - 2].id);
      return;
    }

    handleGoRoot();
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function openRenameModal(node: StorageNode) {
    setRenameNodeId(node.id);
    setRenameNodeName(node.name);
    setRenameNodeType(node.type);
    setOpenNodeMenuId(null);
    setRenameModalOpen(true);
  }

  function openShareModal(node: StorageNode) {
    if (node.type !== "folder") return;

    setShareNodeId(node.id);
    setShareFolderName(node.name);
    setOpenNodeMenuId(null);
    setShareModalOpen(true);
  }

  function closeShareModal() {
    setShareModalOpen(false);
    setShareNodeId(null);
    setShareFolderName("");
  }

  const fetchPage = useCallback(
    async (cursor?: number) => {
      const qs = new URLSearchParams();

      if (eventId !== null && eventId !== undefined) {
        qs.set("eventId", String(eventId));
      }

      if (currentFolderId !== null) {
        qs.set("parentId", String(currentFolderId));
      }

      if (cursor) {
        qs.set("cursor", String(cursor));
      }

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
      const qs = new URLSearchParams();

      if (currentFolderId !== null) {
        qs.set("folderId", String(currentFolderId));
      }

      if (eventId !== null && eventId !== undefined) {
        qs.set("eventId", String(eventId));
      }

      const query = qs.toString();
      const result = await apiFetch(
        `/storage/breadcrumb${query ? `?${query}` : ""}`,
        "GET",
      );

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
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, nextCursor, isFetchingMore, loadMore]);

  useEffect(() => {
    loadInitial();
  }, [eventId, currentFolderId]);

  useEffect(() => {
    function handleDocumentClick(e: MouseEvent) {
      const target = e.target as HTMLElement;

      const clickedCreateMenu =
        createMenuRef.current && createMenuRef.current.contains(target);

      const clickedNodeMenu = target.closest("[data-node-menu]");
      const clickedNodeButton = target.closest("[data-node-menu-button]");
      const clickedFileCard = target.closest("[data-file-card='true']");
      const clickedToolbar =
        target.closest("input") ||
        target.closest("select") ||
        target.closest("button") ||
        target.closest("label");

      if (!clickedCreateMenu) {
        setOpenCreateMenu(false);
      }

      if (!clickedNodeMenu && !clickedNodeButton) {
        setOpenNodeMenuId(null);
      }

      if (
        selectedIds.length > 0 &&
        !skipClearSelectionOnClickRef.current &&
        !clickedFileCard &&
        !clickedNodeMenu &&
        !clickedNodeButton &&
        !clickedToolbar
      ) {
        setSelectedIds([]);
      }

      if (skipClearSelectionOnClickRef.current) {
        skipClearSelectionOnClickRef.current = false;
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenCreateMenu(false);
        setOpenNodeMenuId(null);
        setLightboxIndex(null);
        setSelectionBox(null);
        setIsDraggingSelection(false);
        setShareModalOpen(false);
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

    if (
      !window.confirm(
        `Deseja excluir ${selectedIds.length} ${
          selectedIds.length === 1 ? "item" : "itens"
        }?`,
      )
    ) {
      return;
    }

    try {
      await Promise.all(
        selectedIds.map((id) => apiFetch(`/storage/nodes/${id}`, "DELETE")),
      );

      setSelectedIds([]);
      await loadInitial();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir itens.");
    }
  }

  function handleDownloadSelected() {
    if (selectedIds.length === 0) return;

    void (async () => {
      try {
        const response = await fetch(`${API_BASE}/storage/download-zip`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nodeIds: selectedIds }),
        });

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

  function handleMoveSelected() {
    if (selectedIds.length === 0) return;
    setMoveModalOpen(true);
  }

  async function handleMovedSelected() {
    setMoveModalOpen(false);
    setSelectedIds([]);
    await loadInitial();
  }

  function handleDownloadNode(node: StorageNode) {
    window.open(`${API_BASE}/storage/nodes/${node.id}/download`, "_blank");
    setOpenNodeMenuId(null);
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadDismissTimer.current) {
      clearTimeout(uploadDismissTimer.current);
    }

    const total = files.length;
    const firstName = files[0].name;

    setUploadState({
      status: "uploading",
      total,
      fileName: total > 1 ? `${firstName} e mais ${total - 1}` : firstName,
    });

    try {
      const formData = new FormData();

      if (eventId !== null && eventId !== undefined) {
        formData.append("eventId", String(eventId));
      }

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

      setUploadState({ status: "done", total });

      await loadInitial();

      setTimeout(() => {
        loadInitial();
      }, 1500);

      uploadDismissTimer.current = setTimeout(
        () => setUploadState({ status: "idle" }),
        3000,
      );
    } catch (err) {
      setUploadState({
        status: "error",
        message:
          err instanceof Error ? err.message : "Falha ao enviar arquivos.",
      });

      uploadDismissTimer.current = setTimeout(
        () => setUploadState({ status: "idle" }),
        4000,
      );
    } finally {
      e.target.value = "";
    }
  }

  const filteredItems = useMemo(
    () => filterItems(items, search),
    [items, search],
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

  useEffect(() => {
    if (lightboxIndex === null) return;

    function handleLightboxKeys(e: KeyboardEvent) {
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

    document.addEventListener("keydown", handleLightboxKeys);
    return () => document.removeEventListener("keydown", handleLightboxKeys);
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

        <StorageToolbar
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
          selectedCount={selectedIds.length}
          onClearSelection={clearSelection}
          onDeleteSelected={handleDeleteSelected}
          onDownloadSelected={handleDownloadSelected}
          onMoveSelected={handleMoveSelected}
          openCreateMenu={openCreateMenu}
          onToggleCreateMenu={() => setOpenCreateMenu((prev) => !prev)}
          onCreateFolder={() => {
            setOpenCreateMenu(false);
            setOpenModal(true);
          }}
          onAddFiles={() => {
            setOpenCreateMenu(false);
            fileInputRef.current?.click();
          }}
          createMenuRef={createMenuRef}
        />

        <StorageUploadProgressBar state={uploadState} />

        <div className="h-px w-full bg-gray-100" />

        <StorageBreadcrumb
          currentFolderId={currentFolderId}
          rootLabel={rootLabel}
          breadcrumb={breadcrumb}
          externalCrumb={externalCrumb}
          onGoRoot={handleGoRoot}
          onGoBackFolder={handleGoBackFolder}
          onOpenFolder={handleOpenFolder}
        />

        <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
          {isLoading ? (
            <StorageLoadingState />
          ) : error ? (
            <StorageErrorState error={error} />
          ) : filteredItems.length === 0 ? (
            <StorageEmptyState />
          ) : (
            <StorageSections
              folders={folders}
              files={files}
              imageFiles={imageFiles}
              openNodeMenuId={openNodeMenuId}
              selectedIds={selectedIds}
              filesGridRef={filesGridRef}
              selectionBox={selectionBox}
              sentinelRef={sentinelRef}
              isFetchingMore={isFetchingMore}
              onFolderMenuToggle={(folderId) =>
                setOpenNodeMenuId((prev) =>
                  prev === folderId ? null : folderId,
                )
              }
              onFileMenuToggle={(fileId) =>
                setOpenNodeMenuId((prev) => (prev === fileId ? null : fileId))
              }
              onRename={openRenameModal}
              onDelete={handleDeleteNode}
              onOpenFolder={handleOpenFolder}
              onShare={openShareModal}
              onToggleSelect={toggleSelect}
              onDownload={handleDownloadNode}
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

        <CreateFolderModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onCreated={loadInitial}
          eventId={eventId ?? undefined}
          parentId={currentFolderId}
        />

        <RenameNodeModal
          open={renameModalOpen}
          onClose={() => setRenameModalOpen(false)}
          onRenamed={loadInitial}
          nodeId={renameNodeId}
          currentName={renameNodeName}
          nodeType={renameNodeType}
        />

        <SharePublicLinkModal
          open={shareModalOpen}
          onClose={closeShareModal}
          nodeId={shareNodeId}
          folderName={shareFolderName}
        />

        <MoveSelectedNodesModal
          open={moveModalOpen}
          onClose={() => setMoveModalOpen(false)}
          onMoved={handleMovedSelected}
          eventId={eventId}
          currentFolderId={currentFolderId}
          selectedIds={selectedIds}
        />
      </div>

      <StorageLightbox
        file={currentLightboxFile}
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
      />
    </>
  );
}
