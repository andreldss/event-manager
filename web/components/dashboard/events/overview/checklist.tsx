"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type ChecklistItem = {
  id: string;
  text: string;
  date: string;
  done: boolean;
};

export default function OverviewChecklist({ eventId }: { eventId: number }) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [date, setDate] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const r = await apiFetch(`/events/${eventId}/checklist`, "GET");
      setItems(Array.isArray(r) ? r : []);
    } catch {
      setError("Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  async function add() {
    if (loading || !text.trim()) return;

    setLoading(true);
    setError("");

    try {
      await apiFetch(`/events/${eventId}/checklist`, "POST", {
        text: text.trim(),
        date,
      });

      setText("");
      setDate("");
      await load();
    } catch {
      setError("Falha ao criar.");
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      await apiFetch(`/events/${eventId}/checklist/${id}`, "DELETE");
      await load();
    } catch {
      setError("Falha ao remover.");
      setLoading(false);
    }
  }

  async function toggle(id: string) {
    try {
      await apiFetch(`/events/${eventId}/checklist/${id}/done`, "PATCH");
      await load();
    } catch {
      setError("Falha ao atualizar.");
    }
  }

  useEffect(() => {
    load();
  }, [eventId]);

  const done = items.filter((i) => i.done).length;
  const progress = items.length ? (done / items.length) * 100 : 0;

  return (
    <div className="flex min-h-0 flex-[2] flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 pt-4 pb-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Checklist
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {items.length > 0
                  ? `${done} de ${items.length} concluídos`
                  : "Organize as tarefas principais do evento"}
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
              {done}/{items.length}
            </span>
          </div>

          <div className="mb-3 h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-slate-800 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Novo item..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-slate-200"
            />

            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-slate-200"
              />

              <button
                onClick={add}
                disabled={loading}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-700 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {error && (
            <p className="mx-4 mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
              {error}
            </p>
          )}

          {items.length === 0 && !loading && (
            <div className="px-4 py-5">
              <p className="text-sm text-slate-500">Nenhum item ainda.</p>
              <p className="mt-1 text-xs text-slate-400">
                Adicione tarefas, prazos e pendências para acompanhar melhor o
                evento.
              </p>
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-3 border-b border-slate-50 px-4 py-3 transition last:border-0 hover:bg-slate-50/60"
            >
              <input
                type="checkbox"
                checked={!!item.done}
                onChange={() => toggle(item.id)}
                className="h-4 w-4 cursor-pointer rounded accent-slate-800"
              />

              <span
                className={`min-w-0 flex-1 break-words text-sm ${
                  item.done ? "text-slate-400 line-through" : "text-slate-700"
                }`}
              >
                {item.text}
              </span>

              {item.date && (
                <span className="shrink-0 text-xs text-slate-400">
                  {new Date(item.date).toLocaleDateString("pt-BR", {
                    timeZone: "UTC",
                  })}
                </span>
              )}

              <button
                onClick={() => remove(item.id)}
                className="rounded-lg p-1 text-slate-400 opacity-40 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
