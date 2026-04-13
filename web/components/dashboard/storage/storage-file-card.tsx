"use client";

import type { StorageNode } from "@/types/storage";
import { API_BASE, formatSize, isImage, isVideo } from "./utils";

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

type Props = {
  node: StorageNode;
  selected: boolean;
  menuOpen: boolean;
  thumbnailUrl?: string | null;
  showActions?: boolean;
  onToggleSelect: () => void;
  onMenuToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onPreview: () => void;
};

export default function StorageFileCard({
  node,
  selected,
  menuOpen,
  thumbnailUrl,
  showActions = true,
  onToggleSelect,
  onMenuToggle,
  onRename,
  onDelete,
  onDownload,
  onPreview,
}: Props) {
  const hasThumbnail = !!node.thumbKey;
  const resolvedThumbnailUrl =
    thumbnailUrl !== undefined
      ? thumbnailUrl
      : hasThumbnail
        ? `${API_BASE}/storage/nodes/${node.id}/thumbnail`
        : null;
  const previewable = isImage(node.mimeType);

  return (
    <div
      className={`group relative cursor-pointer select-none overflow-hidden rounded-xl border bg-white transition-all ${
        selected
          ? "border-background ring-2 ring-background shadow-md"
          : "border-gray-200 shadow-sm hover:shadow-md"
      }`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;

        if (e.ctrlKey || e.metaKey) {
          onToggleSelect();
        } else {
          if (previewable) onPreview();
          else onDownload();
        }
      }}
    >
      {showActions && <div className="absolute right-2 top-2 z-20">
        <button
          type="button"
          data-node-menu-button
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle();
          }}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-white/90 text-base text-gray-600 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100"
        >
          ···
        </button>

        {menuOpen && (
          <div
            data-node-menu
            className="absolute right-0 top-full z-30 mt-1 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl"
          >
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
      </div>}

      <div
        className={`relative w-full bg-gray-50 ${previewable ? "cursor-pointer" : ""}`}
        style={{ aspectRatio: "4/3" }}
      >
        {resolvedThumbnailUrl ? (
          <img
            src={resolvedThumbnailUrl}
            alt={node.name}
            className="h-full w-full object-cover"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileIcon mimeType={node.mimeType} />
          </div>
        )}

        {isVideo(node.mimeType) && resolvedThumbnailUrl && (
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

        {selected && (
          <div className="absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-background shadow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="white"
              className="h-3 w-3"
            >
              <path
                fillRule="evenodd"
                d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 011.04-.207z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="px-3 py-2.5">
        <p className="truncate text-sm font-medium leading-snug text-gray-800">
          {node.name}
        </p>

        {node.size != null && (
          <p className="mt-0.5 text-xs text-gray-400">
            {formatSize(node.size)}
          </p>
        )}
      </div>
    </div>
  );
}
