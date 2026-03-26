"use client";

import { useEffect, useMemo, useState } from "react";
import CreateFolderModal from "./create-folder-modal";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import FolderCard from "./folder-card";

type Folder = {
  id: number;
  name: string;
  eventId: number;
  parentId?: number | null;
  updatedAt?: string;
};

type Props = {
  eventId: number;
};

export default function AttachmentsTab({ eventId }: Props) {
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFolderIdParam = searchParams.get("folderId");
  const currentFolderId = currentFolderIdParam
    ? Number(currentFolderIdParam)
    : null;

  function handleOpenFolder(folderId: number) {
    const base = window.location.pathname;
    router.push(`${base}?tab=storage&folderId=${folderId}`);
  }

  function handleGoRoot() {
    const base = window.location.pathname;
    router.push(`${base}?tab=storage`);
  }

  async function loadFolders() {
    setError("");
    setIsLoading(true);

    try {
      const qs = new URLSearchParams();
      qs.set("eventId", String(eventId));
      if (currentFolderId !== null) qs.set("parentId", String(currentFolderId));

      const response = await apiFetch(
        `/storage/folders?${qs.toString()}`,
        "GET",
      );
      setFolders(Array.isArray(response) ? response : []);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Falha ao carregar pastas.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isFinite(eventId)) return;
    loadFolders();
  }, [eventId, currentFolderId]);

  const filteredFolders = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return folders;
    return folders.filter((f) => f.name.toLowerCase().includes(term));
  }, [folders, search]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3">
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

        <button
          type="button"
          onClick={() => setOpenModal(true)}
          className="shrink-0 rounded-lg border bg-background px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 cursor-pointer"
        >
          + Novo
        </button>
      </div>

      <div className="h-px w-full bg-gray-200" />

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <button onClick={handleGoRoot} className="hover:underline">
          Anexos
        </button>
        {currentFolderId ? <span>/ Pasta {currentFolderId}</span> : null}
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-gray-500">Carregando pastas...</span>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-red-500">{error}</span>
          </div>
        ) : filteredFolders.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-gray-500">
              Nenhum arquivo encontrado.
            </span>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                name={folder.name}
                updatedAt={folder.updatedAt}
                onOpen={() => handleOpenFolder(folder.id)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateFolderModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={loadFolders}
        eventId={eventId}
        parentId={currentFolderId}
      />
    </div>
  );
}
