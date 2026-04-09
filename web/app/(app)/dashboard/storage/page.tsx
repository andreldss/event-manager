"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import StorageManager from "@/components/dashboard/storage/storage-manager";
import FolderCard from "@/components/dashboard/storage/folder-card";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

type Client = {
  id: number;
  name: string;
};

type GlobalEvent = {
  id: number;
  name: string;
  date?: string | null;
};

export default function StoragePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventIdParam = searchParams.get("eventId");
  const folderIdParam = searchParams.get("folderId");
  const clientIdParam = searchParams.get("clientId");
  const eventNameParam = searchParams.get("eventName");

  const eventId = eventIdParam ? Number(eventIdParam) : null;
  const folderId = folderIdParam ? Number(folderIdParam) : null;
  const clientId = clientIdParam ? Number(clientIdParam) : null;

  const selectedEventName = eventNameParam || "Evento";
  const isRootGlobal = !eventId && !folderId;

  const [clients, setClients] = useState<Client[]>([]);
  const [events, setEvents] = useState<GlobalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadRootData() {
    setError("");
    setIsLoading(true);

    try {
      const [clientsResponse, eventsResponse] = await Promise.all([
        apiFetch("/clients", "GET"),
        apiFetch(
          `/storage/global-root${clientId ? `?clientId=${clientId}` : ""}`,
          "GET",
        ),
      ]);

      setClients(Array.isArray(clientsResponse) ? clientsResponse : []);
      setEvents(Array.isArray(eventsResponse) ? eventsResponse : []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Falha ao carregar os arquivos.");
      }

      setClients([]);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isRootGlobal) {
      loadRootData();
    }
  }, [isRootGlobal, clientId]);

  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return events;

    return events.filter((event) =>
      (event.name || "").toLowerCase().includes(term),
    );
  }, [events, search]);

  function handleClientChange(nextClientId: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextClientId) {
      params.set("clientId", nextClientId);
    } else {
      params.delete("clientId");
    }

    params.delete("eventId");
    params.delete("folderId");
    params.delete("eventName");

    const query = params.toString();
    router.push(query ? `/dashboard/storage?${query}` : "/dashboard/storage");
  }

  function handleOpenEvent(event: GlobalEvent) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("eventId", String(event.id));
    params.set("eventName", event.name);
    params.delete("folderId");

    const query = params.toString();
    router.push(`/dashboard/storage?${query}`);
  }

  function handleBackToRoot() {
    router.push("/dashboard/storage");
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Anexos
        </p>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">Arquivos</h1>
      </div>

      {isRootGlobal ? (
        <div className="min-h-0 flex-1 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Eventos</p>
              <p className="mt-1 text-xs text-slate-500">
                Selecione um evento para visualizar os arquivos.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative w-full sm:w-[280px]">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar evento..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="w-full sm:w-[240px]">
                <select
                  value={clientId ? String(clientId) : ""}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">Todos os clientes</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="min-h-0 overflow-y-auto">
            {isLoading ? (
              <div className="flex min-h-[260px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
                  <p className="text-sm text-slate-500">
                    Carregando eventos...
                  </p>
                </div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex min-h-[260px] items-center justify-center">
                <span className="text-sm text-slate-500">
                  Nenhum evento encontrado.
                </span>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredEvents.map((event) => (
                  <div key={event.id}>
                    <FolderCard
                      name={event.name}
                      updatedAt={event.date ?? undefined}
                      onOpen={() => handleOpenEvent(event)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 rounded-2xl border border-slate-200 bg-white p-5">
          <StorageManager
            eventId={eventId}
            rootLabel="Arquivos"
            externalCrumb={{
              label: "Arquivos",
              currentLabel: selectedEventName,
              onBack: handleBackToRoot,
            }}
          />
        </div>
      )}
    </div>
  );
}
