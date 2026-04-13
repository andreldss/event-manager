"use client";

import { RefObject } from "react";
import type { SortOption } from "@/types/storage";
import StorageSelectionBar from "./storage-selection-bar";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  selectedCount: number;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onDownloadSelected: () => void;
  onMoveSelected: () => void;
  openCreateMenu: boolean;
  onToggleCreateMenu: () => void;
  onCreateFolder: () => void;
  onAddFiles: () => void;
  createMenuRef: RefObject<HTMLDivElement | null>;
};

export default function StorageToolbar({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  selectedCount,
  onClearSelection,
  onDeleteSelected,
  onDownloadSelected,
  onMoveSelected,
  openCreateMenu,
  onToggleCreateMenu,
  onCreateFolder,
  onAddFiles,
  createMenuRef,
}: Props) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <div className="flex w-full max-w-xl gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar nesta pasta..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
        />

        <div className="shrink-0">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-200"
          >
            <option value="name-asc">Nome (A-Z)</option>
            <option value="name-desc">Nome (Z-A)</option>
            <option value="updated-desc">Mais recentes</option>
            <option value="updated-asc">Mais antigos</option>
          </select>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="shrink-0">
          <StorageSelectionBar
            count={selectedCount}
            onClear={onClearSelection}
            onDelete={onDeleteSelected}
            onDownload={onDownloadSelected}
            onMove={onMoveSelected}
          />
        </div>
      )}

      <div className="relative shrink-0" ref={createMenuRef}>
        <button
          type="button"
          onClick={onToggleCreateMenu}
          className="cursor-pointer rounded-lg bg-background px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          + Novo
        </button>

        {openCreateMenu && (
          <div className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
            <button
              type="button"
              onClick={onCreateFolder}
              className="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Nova pasta
            </button>

            <button
              type="button"
              onClick={onAddFiles}
              className="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Adicionar arquivos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
