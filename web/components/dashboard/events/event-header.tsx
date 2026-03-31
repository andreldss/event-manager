"use client";

import { CalendarDays, MapPin, Layers } from "lucide-react";

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

export default function EventHeader({ event }: Props) {
  const st = STATUS_CONFIG[event.status] ?? {
    label: event.status,
    dot: "bg-slate-300",
    text: "text-slate-500",
  };

  return (
    <div className="flex flex-col gap-3 bg-gray-100 rounded-xl p-6">
      {/* Status pill */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${st.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          {st.label}
        </span>

        {event.type === "collective" && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Layers size={11} />
            Coletivo
          </span>
        )}
      </div>

      {/* Nome */}
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900 leading-none">
          {event.name}
        </h1>
        {event.clientName && (
          <p className="mt-1.5 text-sm text-slate-500">{event.clientName}</p>
        )}
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2">
        {event.date && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            <CalendarDays size={11} className="text-slate-400" />
            {formatDate(event.date)}
          </span>
        )}
        {event.location && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            <MapPin size={11} className="text-slate-400" />
            {event.location}
          </span>
        )}
      </div>
    </div>
  );
}
