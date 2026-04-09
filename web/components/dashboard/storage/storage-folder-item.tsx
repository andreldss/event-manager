"use client";

import FolderCard from "./folder-card";
import type { StorageNode } from "@/types/storage";

type Props = {
  folder: StorageNode;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  onOpen: () => void;
  onShare: () => void;
};

export default function StorageFolderItem({
  folder,
  menuOpen,
  onMenuToggle,
  onRename,
  onDelete,
  onOpen,
  onShare,
}: Props) {
  return (
    <div className="relative">
      <div className="absolute right-3 top-3 z-20">
        <div className="relative">
          <button
            type="button"
            data-node-menu-button
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-white/90 text-base text-gray-600 shadow-sm hover:bg-white"
          >
            ···
          </button>

          {menuOpen && (
            <div
              data-node-menu
              className="absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
                className="w-full cursor-pointer px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Compartilhar
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
        </div>
      </div>

      <FolderCard
        name={folder.name}
        updatedAt={folder.updatedAt}
        onOpen={onOpen}
      />
    </div>
  );
}
