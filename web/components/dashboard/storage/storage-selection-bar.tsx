"use client";

export default function StorageSelectionBar({
  count,
  onClear,
  onDelete,
  onDownload,
  onMove,
  showDelete = true,
  showDownload = true,
  showMove = true,
}: {
  count: number;
  onClear: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onMove?: () => void;
  showDelete?: boolean;
  showDownload?: boolean;
  showMove?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl text-background">
      <span className="whitespace-nowrap text-sm font-medium">
        {count} {count === 1 ? "selecionado" : "selecionados"}
      </span>

      {showDownload && onDownload && (
        <button
          type="button"
          onClick={onDownload}
          className="cursor-pointer rounded-lg bg-slate-700 px-3 py-1.5 text-xs text-white hover:bg-slate-800"
        >
          Baixar
        </button>
      )}

      {showMove && onMove && (
        <button
          type="button"
          onClick={onMove}
          className="cursor-pointer rounded-lg bg-amber-500 px-3 py-1.5 text-xs text-white hover:bg-amber-600"
        >
          Mover
        </button>
      )}

      {showDelete && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="cursor-pointer rounded-lg bg-red-500/90 px-3 py-1.5 text-xs text-white hover:bg-red-500"
        >
          Excluir
        </button>
      )}

      <button
        type="button"
        onClick={onClear}
        className="cursor-pointer rounded-lg bg-background px-3 py-1.5 text-xs text-white hover:opacity-80"
      >
        Limpar
      </button>
    </div>
  );
}
