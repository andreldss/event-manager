"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api";

type FolderOption = {
  id: number;
  name: string;
  parentId?: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onMoved?: () => void;
  eventId?: number | null;
  currentFolderId?: number | null;
  selectedIds: number[];
};

export default function MoveSelectedNodesModal({
  open,
  onClose,
  onMoved,
  eventId,
  currentFolderId,
  selectedIds,
}: Props) {
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [targetParentId, setTargetParentId] = useState<string>("root");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setFolders([]);
      setTargetParentId("root");
      setLoading(false);
      setSaving(false);
      setError("");
      return;
    }

    async function loadFolders() {
      setLoading(true);
      setError("");

      try {
        const qs = new URLSearchParams();

        if (eventId !== null && eventId !== undefined) {
          qs.set("eventId", String(eventId));
        }

        const result = await apiFetch(
          `/storage/folders${qs.toString() ? `?${qs.toString()}` : ""}`,
          "GET",
        );

        setFolders(Array.isArray(result) ? result : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Falha ao carregar pastas.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadFolders();
  }, [open, eventId]);

  const folderOptions = useMemo(() => {
    const map = new Map<number, FolderOption>(
      folders.map((folder) => [folder.id, folder]),
    );

    function buildPath(folder: FolderOption) {
      const parts = [folder.name];
      let parentId = folder.parentId ?? null;

      while (parentId) {
        const parent = map.get(parentId);
        if (!parent) break;
        parts.unshift(parent.name);
        parentId = parent.parentId ?? null;
      }

      return parts.join(" / ");
    }

    return folders
      .filter((folder) => folder.id !== currentFolderId)
      .map((folder) => ({
        ...folder,
        label: buildPath(folder),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [folders, currentFolderId]);

  async function handleMove() {
    if (selectedIds.length === 0) return;

    setSaving(true);
    setError("");

    const parsedTargetParentId =
      targetParentId === "root" ? null : Number(targetParentId);

    try {
      await Promise.all(
        selectedIds.map((id) =>
          apiFetch(`/storage/nodes/${id}/move`, "PATCH", {
            targetParentId: parsedTargetParentId,
            eventId: eventId ?? undefined,
          }),
        ),
      );

      onClose();
      onMoved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao mover itens.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (!saving) onClose();
        }}
      />

      <div className="relative w-full max-w-xl rounded-xl bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-background">Mover arquivos</h2>
            <p className="text-sm text-gray-500">
              Escolha a pasta de destino para {selectedIds.length}{" "}
              {selectedIds.length === 1 ? "arquivo" : "arquivos"}.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!saving) onClose();
            }}
            className="cursor-pointer rounded p-1 text-gray-600 transition hover:bg-gray-100"
            aria-label="Fechar"
          >
            <X />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
              Carregando pastas...
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-sm text-background">Destino</span>
              <select
                value={targetParentId}
                onChange={(e) => setTargetParentId(e.target.value)}
                disabled={saving}
                className="rounded-lg border bg-gray-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <option value="root">Pasta raiz do evento</option>
                {folderOptions.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="cursor-pointer rounded-lg border bg-white px-4 py-2 font-semibold transition hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleMove}
              disabled={loading || saving || selectedIds.length === 0}
              className="cursor-pointer rounded-lg bg-background px-4 py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Movendo..." : "Mover"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
