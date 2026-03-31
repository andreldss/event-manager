"use client";

import { apiFetch } from "@/lib/api";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

type RenameNodeModalProps = {
  open: boolean;
  onClose: () => void;
  onRenamed?: () => void;
  nodeId: number | null;
  currentName: string;
  nodeType: "folder" | "file" | null;
};

function getExtension(name: string) {
  const lastDot = name.lastIndexOf(".");

  if (lastDot <= 0 || lastDot === name.length - 1) {
    return "";
  }

  return name.slice(lastDot);
}

function getBaseName(name: string) {
  const lastDot = name.lastIndexOf(".");

  if (lastDot <= 0) {
    return name;
  }

  return name.slice(0, lastDot);
}

export default function RenameNodeModal({
  open,
  onClose,
  onRenamed,
  nodeId,
  currentName,
  nodeType,
}: RenameNodeModalProps) {
  const [name, setName] = useState("");
  const [extension, setExtension] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (nodeType === "file") {
      setName(getBaseName(currentName || ""));
      setExtension(getExtension(currentName || ""));
    } else {
      setName(currentName || "");
      setExtension("");
    }

    setLoading(false);
    setError("");
  }, [open, currentName, nodeType]);

  function resetState() {
    setName("");
    setExtension("");
    setLoading(false);
    setError("");
  }

  function handleClose() {
    if (loading) return;
    resetState();
    onClose();
  }

  async function handleRename() {
    if (!nodeId || !nodeType) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Nome obrigatório.");
      return;
    }

    const finalName =
      nodeType === "file" ? `${trimmedName}${extension}` : trimmedName;

    if (finalName === currentName.trim()) {
      handleClose();
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiFetch(`/storage/nodes/${nodeId}/rename`, "PATCH", {
        name: finalName,
      });

      resetState();
      onClose();

      if (onRenamed) {
        onRenamed();
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Falha ao renomear item.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const title = nodeType === "folder" ? "Renomear pasta" : "Renomear arquivo";
  const placeholder =
    nodeType === "folder" ? "Ex: Financeiro, Fotos..." : "Nome do arquivo";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative w-[560px] max-w-[92vw] rounded-xl bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-background">{title}</h2>

          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer rounded p-1 text-gray-600 transition hover:bg-gray-100"
            aria-label="Fechar"
            disabled={loading}
          >
            <X />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-background">Nome</span>

            {nodeType === "file" ? (
              <div className="flex overflow-hidden rounded-lg border bg-gray-50 focus-within:ring-2 focus-within:ring-gray-200">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                  }}
                  className="flex-1 bg-transparent px-4 py-2 outline-none"
                  placeholder={placeholder}
                  disabled={loading}
                  autoFocus
                />
                <div className="flex items-center border-l bg-gray-100 px-3 text-sm text-gray-500">
                  {extension || "sem extensão"}
                </div>
              </div>
            ) : (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                }}
                className="rounded-lg border bg-gray-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-200"
                placeholder={placeholder}
                disabled={loading}
                autoFocus
              />
            )}
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="cursor-pointer rounded-lg border bg-white px-4 py-2 font-semibold transition hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleRename}
              className="cursor-pointer rounded-lg bg-background px-4 py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
