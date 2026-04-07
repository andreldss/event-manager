"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ChevronRight, RotateCcw, Search, Plus } from "lucide-react";

type Client = {
  id: string | number;
  name: string;
  phone?: string | null;
  notes?: string | null;
  createdAt?: string;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadClients() {
    setError("");
    setIsLoading(true);

    try {
      const response = await apiFetch("/clients", "GET");
      setClients(Array.isArray(response) ? response : []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Falha ao carregar os clientes.");
      }

      setClients([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return clients;

    return clients.filter((client) =>
      (client.name || "").toLowerCase().includes(term),
    );
  }, [clients, search]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Cadastros
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Clientes
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-[280px]">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar nome do cliente..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <button
              onClick={loadClients}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw size={15} />
              Recarregar
            </button>

            <Link
              href="/dashboard/records/clients/new"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <Plus size={15} />
              Novo cliente
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Lista
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {isLoading
                  ? "Carregando clientes..."
                  : `${filteredClients.length} ${
                      filteredClients.length === 1
                        ? "cliente encontrado"
                        : "clientes encontrados"
                    }`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
              <p className="mt-4 text-sm text-slate-500">
                Buscando clientes...
              </p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="px-4 py-6">
              <p className="text-sm text-slate-500">
                Nenhum cliente encontrado.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Tente ajustar a busca ou crie um novo cliente.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <Link
                  key={String(client.id)}
                  href={`/dashboard/records/clients/${client.id}`}
                  className="group block transition hover:bg-slate-50/70"
                >
                  <div className="flex items-center justify-between gap-4 px-4 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-slate-400">
                          #{client.id}
                        </span>
                        <p className="truncate text-[15px] font-semibold text-slate-900">
                          {client.name}
                        </p>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                        <span>
                          {client.phone
                            ? `Fone: ${client.phone}`
                            : "Sem telefone"}
                        </span>
                      </div>
                    </div>

                    <ChevronRight
                      size={18}
                      className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
