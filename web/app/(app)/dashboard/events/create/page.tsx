"use client";

import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Client = {
  id: number;
  name: string;
};

export default function CreateEvent() {
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<"collective" | "simple">("simple");
  const [eventDate, setEventDate] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, query]);

  async function loadClients() {
    setError("");

    try {
      const response = await apiFetch("/clients", "GET");
      setClients(Array.isArray(response) ? response : []);
    } catch {
      setError("Falha ao carregar clientes.");
      setClients([]);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await apiFetch("/events/create", "POST", {
        name: eventName,
        type: eventType,
        date: eventDate,
        location: eventLocation,
        notes: eventNotes,
        clientId,
      });

      router.push("/dashboard/events");
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Falha ao criar evento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Eventos
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Criar evento
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-slate-600">
                  Nome do evento*
                </label>
                <input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600">
                  Tipo do evento*
                </label>

                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEventType("simple")}
                    className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition cursor-pointer ${
                      eventType === "simple"
                        ? "bg-slate-900 text-white border-slate-900"
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
                        ? "bg-slate-900 text-white border-slate-900"
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
                onBlur={() => setOpen(false)}
              >
                <label className="text-sm text-slate-600">Cliente*</label>

                <input
                  value={
                    open
                      ? query
                      : clients.find((c) => c.id === clientId)?.name || ""
                  }
                  onFocus={() => setOpen(true)}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                  }}
                  placeholder="Selecione um cliente..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
                />

                {open && (
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
                            setOpen(false);
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

          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/events")}
              className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 cursor-pointer transition"
            >
              {loading ? "Salvando..." : "Criar evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
