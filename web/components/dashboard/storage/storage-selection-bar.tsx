"use client";

export default function StorageSelectionBar({
  count,
  onClear,
  onDelete,
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl text-background">
      <span className="whitespace-nowrap text-sm font-medium">
        {count} {count === 1 ? "selecionado" : "selecionados"}
      </span>

      <button
        type="button"
        onClick={onDelete}
        className="cursor-pointer rounded-lg bg-red-500/90 px-3 py-1.5 text-xs text-white hover:bg-red-500"
      >
        Excluir
      </button>

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
