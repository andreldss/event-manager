"use client";

import { RefObject } from "react";
import type { StorageNode } from "@/types/storage";
import StorageFolderItem from "./storage-folder-item";
import StorageFileCard from "./storage-file-card";

type Props = {
  folders: StorageNode[];
  files: StorageNode[];
  imageFiles: StorageNode[];
  openNodeMenuId: number | null;
  selectedIds: number[];
  filesGridRef: RefObject<HTMLDivElement | null>;
  selectionBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  sentinelRef: RefObject<HTMLDivElement | null>;
  isFetchingMore: boolean;
  onFolderMenuToggle: (folderId: number) => void;
  onFileMenuToggle: (fileId: number) => void;
  onRename: (node: StorageNode) => void;
  onDelete: (node: StorageNode) => void;
  onOpenFolder: (folderId: number) => void;
  onShare: (node: StorageNode) => void;
  onToggleSelect: (id: number) => void;
  onDownload: (node: StorageNode) => void;
  onPreview: (index: number) => void;
  onFilesMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
};

export default function StorageSections({
  folders,
  files,
  imageFiles,
  openNodeMenuId,
  selectedIds,
  filesGridRef,
  selectionBox,
  sentinelRef,
  isFetchingMore,
  onFolderMenuToggle,
  onFileMenuToggle,
  onRename,
  onDelete,
  onOpenFolder,
  onShare,
  onToggleSelect,
  onDownload,
  onPreview,
  onFilesMouseDown,
}: Props) {
  return (
    <div className="flex flex-col gap-6 p-6">
      {folders.length > 0 && (
        <section>
          {files.length > 0 && (
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Pastas
            </h3>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {folders.map((folder) => (
              <div key={folder.id} className="group">
                <StorageFolderItem
                  folder={folder}
                  menuOpen={openNodeMenuId === folder.id}
                  onMenuToggle={() => onFolderMenuToggle(folder.id)}
                  onRename={() => onRename(folder)}
                  onDelete={() => onDelete(folder)}
                  onOpen={() => onOpenFolder(folder.id)}
                  onShare={() => onShare(folder)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {files.length > 0 && (
        <section>
          {folders.length > 0 && (
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Arquivos
            </h3>
          )}

          <div
            ref={filesGridRef}
            className="relative -m-6 mt-0 flex flex-wrap gap-4 rounded-2xl p-6 select-none"
            onMouseDown={onFilesMouseDown}
          >
            {files.map((file) => {
              const imageIndex = imageFiles.findIndex(
                (image) => image.id === file.id,
              );

              return (
                <div
                  key={file.id}
                  data-file-card="true"
                  data-file-id={file.id}
                  className="w-[180px]"
                >
                  <StorageFileCard
                    node={file}
                    selected={selectedIds.includes(file.id)}
                    menuOpen={openNodeMenuId === file.id}
                    onToggleSelect={() => onToggleSelect(file.id)}
                    onMenuToggle={() => onFileMenuToggle(file.id)}
                    onRename={() => onRename(file)}
                    onDelete={() => onDelete(file)}
                    onDownload={() => onDownload(file)}
                    onPreview={() => {
                      if (imageIndex >= 0) onPreview(imageIndex);
                    }}
                  />
                </div>
              );
            })}

            {selectionBox && (
              <div
                className="pointer-events-none absolute z-40 rounded-md border border-background bg-background/10"
                style={{
                  left: selectionBox.x,
                  top: selectionBox.y,
                  width: selectionBox.width,
                  height: selectionBox.height,
                }}
              />
            )}
          </div>
        </section>
      )}

      <div ref={sentinelRef} className="h-1 w-full" />

      {isFetchingMore && (
        <div className="flex justify-center py-4">
          <span className="text-sm text-gray-400">Carregando mais...</span>
        </div>
      )}
    </div>
  );
}
