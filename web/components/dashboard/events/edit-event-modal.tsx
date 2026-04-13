"use client";

import { apiFetch } from "@/lib/api";
import type { Event } from "@/types/event";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Client = {
  id: number;
  name: string;
};

type Props = {
  open: boolean;
  event: Event | null;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditEventModal({
  open,
  event,
  onClose,
  onUpdated,
}: Props) {
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<"collective" | "simple">("simple");
  const [eventDate, setEventDate] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [openClientMenu, setOpenClientMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [error, setError] = useState("");

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, query]);

  useEffect(() => {
    if (!open || !event) return;

    setEventName(event.name || "");
    setEventType(event.type || "simple");
    setEventDate(event.date ? event.date.slice(0, 10) : "");
    setEventNotes(event.notes || "");
    setEventLocation(event.location || "");
    setClientId(event.clientId ?? null);
    setQuery("");
    setOpenClientMenu(false);
    setError("");
  }, [open, event]);

  useEffect(() => {
    if (!open) return;

    async function loadClients() {
      setLoadingClients(true);
      try {
        const response = await apiFetch("/clients", "GET");
        setClients(Array.isArray(response) ? response : []);
      } catch {
        setClients([]);
      } finally {
        setLoadingClients(false);
      }
    }

    loadClients();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;

    setLoading(true);
    setError("");

    try {
      await apiFetch(`/events/${event.id}`, "PATCH", {
        name: eventName,
        type: eventType,
        date: eventDate,
        location: eventLocation,
        notes: eventNotes,
        clientId,
      });

      onUpdated();
      onClose();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Falha ao editar evento.");
    } finally {
      setLoading(false);
    }
  }

  if (!open || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Evento
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Editar evento
            </h2>
          </div>

          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-slate-600">Nome do evento*</label>
                <input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600">Tipo do evento*</label>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEventType("simple")}
                    className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition cursor-pointer ${
                      eventType === "simple"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Simples
                  </button>

                  <button
                    type="button"
                    onClick={() => setEventType("collective")}
                    className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition cursor-pointer ${
                      eventType === "collective"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Coletivo
                  </button>
                </div>
              </div>

              <div
                className="relative"
                tabIndex={0}
                onBlur={() => setOpenClientMenu(false)}
              >
                <label className="text-sm text-slate-600">Cliente*</label>
                <input
                  value={
                    openClientMenu
                      ? query
                      : clients.find((c) => c.id === clientId)?.name ||
                        event.clientName ||
                        ""
                  }
                  onFocus={() => setOpenClientMenu(true)}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setOpenClientMenu(true);
                  }}
                  placeholder={
                    loadingClients ? "Carregando clientes..." : "Selecione um cliente..."
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
                />

                {openClientMenu && (
                  <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    {filteredClients.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-slate-500">
                        Nenhum cliente encontrado
                      </div>
                    ) : (
                      filteredClients.map((c) => (
                        <div
                          key={c.id}
                          onMouseDown={() => {
                            setClientId(c.id);
                            setQuery("");
                            setOpenClientMenu(false);
                          }}
                          className="cursor-pointer px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {c.name}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-slate-600">Observações</label>
                <textarea
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  rows={4}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-slate-600">Data*</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600">Local*</label>
                <input
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer rounded-xl bg-background px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
