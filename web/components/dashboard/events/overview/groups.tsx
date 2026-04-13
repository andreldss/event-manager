"use client";

import { apiFetch } from "@/lib/api";
import { EventGroup } from "@/types/group";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type Props = {
  eventId: number;
  groups: EventGroup[];
  onGroupsChanged: () => Promise<void>;
};

export default function OverviewGroups({
  eventId,
  groups,
  onGroupsChanged,
}: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function add() {
    if (loading || !text.trim()) return;
    setLoading(true);
    setError("");
    try {
      await apiFetch(`/events/${eventId}/group`, "POST", { text: text.trim() });
      setText("");
      await onGroupsChanged();
    } catch {
      setError("Falha ao criar grupo.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: number) {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await apiFetch(`/events/${eventId}/group/${id}`, "DELETE");
      await onGroupsChanged();
    } catch {
      setError("Falha ao remover.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 flex-[1] min-h-0">
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Ex: 301, 302..."
          className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-slate-200 transition"
        />
        <button
          onClick={add}
          disabled={loading}
          className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-700 transition active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col">
        <div className="px-4 pt-3 pb-2 border-b border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Grupos {groups.length > 0 && `· ${groups.length}`}
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          {error && (
            <p className="mx-4 mt-3 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {groups.length === 0 && (
            <p className="px-4 py-4 text-sm text-slate-500">
              Nenhum grupo ainda.
            </p>
          )}

          {groups.map((item) => (
            <div
              key={item.id}
              className="group px-4 py-3 flex items-center justify-between border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition"
            >
              <span className="text-sm text-slate-700">{item.text}</span>
              <button
                onClick={() => remove(item.id)}
                disabled={loading}
                className="opacity-0 group-hover:opacity-100 transition p-1 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
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
