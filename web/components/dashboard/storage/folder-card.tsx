"use client";

type Props = {
  name: string;
  updatedAt?: string;
  onOpen: () => void;
};

function formatDate(date?: string) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export default function FolderCard({ name, updatedAt, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-4 text-left shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-9 w-9"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.7}
              d="M3 7.5A2.5 2.5 0 015.5 5H9l2 2h7.5A2.5 2.5 0 0121 9.5v7A2.5 2.5 0 0118.5 19h-13A2.5 2.5 0 013 16.5v-9z"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-snug text-gray-800">
            {name}
          </p>

          {updatedAt && (
            <p className="mt-1 text-xs text-gray-400">
              Atualizado em {formatDate(updatedAt)}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}