"use client";

import { Folder, MoreVertical } from "lucide-react";

type FolderCardProps = {
  name: string;
  itemsCount?: number;
  updatedAt?: string | Date;
  readonly?: boolean;
  onOpen: () => void;
  onMenuClick?: () => void;
};

export default function FolderCard({
  name,
  itemsCount,
  updatedAt,
  readonly,
  onOpen,
  onMenuClick,
}: FolderCardProps) {
  const updated = updatedAt
    ? (typeof updatedAt === "string"
        ? new Date(updatedAt)
        : updatedAt
      ).toLocaleDateString("pt-BR")
    : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onDoubleClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      className="group w-full cursor-pointer rounded-lg border bg-white px-4 py-3 text-left shadow-sm hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Folder className="h-5 w-5 text-gray-600" />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-background">
              {name}
            </p>

            {(typeof itemsCount === "number" || updated) && (
              <p className="mt-0.5 text-xs text-gray-500">
                {typeof itemsCount === "number" ? `${itemsCount} itens` : null}
                {typeof itemsCount === "number" && updated ? " • " : null}
                {updated ? `Atualizado ${updated}` : null}
              </p>
            )}
          </div>
        </div>

        {!readonly && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick?.();
            }}
            className="rounded-md p-2 opacity-0 transition hover:bg-gray-100 group-hover:opacity-100"
            aria-label="Ações"
          >
            <MoreVertical className="h-4 w-4 text-gray-600 cursor-pointer active:opacity-90" />
          </button>
        )}
      </div>
    </div>
  );
}
