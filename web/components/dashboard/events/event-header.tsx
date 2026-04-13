"use client";

import { CalendarDays, Ellipsis, Layers, MapPin, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Event = {
  id: string;
  name: string;
  status: string;
  clientName: string | null;
  date: string | null;
  location: string | null;
  type: "simple" | "collective";
};

type Props = { event: Event };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; text: string }
> = {
  active: { label: "Ativo", dot: "bg-emerald-400", text: "text-emerald-700" },
  pending: { label: "Pendente", dot: "bg-amber-400", text: "text-amber-700" },
  cancelled: { label: "Cancelado", dot: "bg-rose-400", text: "text-rose-600" },
  done: { label: "Concluído", dot: "bg-slate-400", text: "text-slate-500" },
};

type HeaderProps = {
  event: Event;
  canManage?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function EventHeader({
  event,
  canManage = false,
  onEdit,
  onDelete,
}: HeaderProps) {
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(eventTarget: MouseEvent) {
      const target = eventTarget.target as HTMLElement;
      if (!menuRef.current?.contains(target)) {
        setOpenMenu(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenMenu(false);
      }
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const st = STATUS_CONFIG[event.status] ?? {
    label: event.status,
    dot: "bg-slate-300",
    text: "text-slate-500",
  };

  return (
    <div className="flex flex-col gap-2 bg-gray-100 rounded-xl p-6">

      <div className="flex justify-between">
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900 leading-none">
          {event.name}
        </h1>

        {canManage && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu((prev) => !prev)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <Ellipsis size={18} />
            </button>

            {openMenu && (
              <div className="absolute right-0 top-11 z-20 min-w-[180px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(false);
                    onEdit?.();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <Pencil size={15} />
                  Editar evento
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(false);
                    onDelete?.();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm text-rose-700 transition hover:bg-rose-50"
                >
                  <Trash2 size={15} />
                  Excluir evento
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {event.clientName && (
        <p className="text-sm text-slate-500">{event.clientName}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {event.date && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-600">
            <CalendarDays size={11} className="text-slate-400" />
            {formatDate(event.date)}
          </span>
        )}
        {event.location && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-600">
            <MapPin size={11} className="text-slate-400" />
            {event.location}
          </span>
        )}
      </div>
    </div>
  );
}
