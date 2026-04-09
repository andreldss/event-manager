"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import type { StorageNode } from "@/types/storage";
import { API_BASE } from "./utils";

type Props = {
  file: StorageNode | null;
  imageUrl?: string;
  canDownload?: boolean;
  onDownload?: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function StorageLightbox({
  file,
  hasPrev,
  hasNext,
  onClose,
  onPrev,
  onNext,
  imageUrl,
  canDownload,
  onDownload,
}: Props) {
  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-6 py-6"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
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
            onPrev();
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
            onNext();
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
          src={imageUrl ?? `${API_BASE}/storage/nodes/${file.id}/raw`}
          alt={file.name}
          className="max-h-[82vh] max-w-[90vw] rounded-lg object-contain"
        />

        <div className="flex items-center gap-3">
          <p className="max-w-[70vw] truncate text-sm text-white">
            {file.name}
          </p>

          {canDownload && onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="cursor-pointer rounded-lg bg-white px-3 py-2 text-sm text-gray-800 hover:bg-gray-100"
            >
              Baixar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
