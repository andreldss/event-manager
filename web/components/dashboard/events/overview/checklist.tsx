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
    try {
      await apiFetch(`/events/${eventId}/checklist`, "POST", {
        text: text.trim(),
        date,
      });
      setText("");
      setDate("");
      load();
    } catch {
      setError("Falha ao criar.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (loading) return;
    setLoading(true);
    try {
      await apiFetch(`/events/${eventId}/checklist/${id}`, "DELETE");
      load();
    } catch {
      setError("Falha ao remover.");
    } finally {
      setLoading(false);
    }
  }

  async function toggle(id: string) {
    try {
      await apiFetch(`/events/${eventId}/checklist/${id}/done`, "PATCH");
      load();
    } catch {
      setError("Falha ao atualizar.");
    }
  }

  useEffect(() => {
    load();
  }, [eventId]);

  const done = items.filter((i) => i.done).length;

  return (
    <div className="flex flex-col gap-3 flex-[2] min-h-0">
      <div className="flex flex-col gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Novo item..."
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-200 transition"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 transition"
          />
          <button
            onClick={add}
            className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-700 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col">
        {items.length > 0 && (
          <div className="px-4 pt-3 pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Checklist
              </span>
              <span className="text-[11px] text-slate-400">
                {done}/{items.length}
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-slate-100">
              <div
                className="h-1 rounded-full bg-slate-800 transition-all duration-300"
                style={{
                  width: `${items.length ? (done / items.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {error && (
            <p className="mx-4 mt-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {items.length === 0 && !loading && (
            <p className="px-4 py-4 text-sm text-slate-400">
              Nenhum item ainda.
            </p>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className="group px-4 py-3 flex items-center gap-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition"
            >
              <input
                type="checkbox"
                checked={!!item.done}
                onChange={() => toggle(item.id)}
                className="w-4 h-4 rounded cursor-pointer accent-slate-800"
              />
              <span
                className={`flex-1 text-sm text-slate-700 break-words min-w-0 ${item.done ? "line-through text-slate-400" : ""}`}
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
                className="opacity-0 group-hover:opacity-100 transition p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 cursor-pointer"
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
