"use client";

import { apiFetch } from "@/lib/api";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Search,
  Shield,
} from "lucide-react";
import type { AuditActorType, AuditListItem, AuditDetail, AuditListResponse } from '@/types/logs'
import { useEffect, useState } from "react";

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(parsed);
}

function formatActor(item: AuditListItem | AuditDetail) {
  if (item.actorType === "user") {
    if (item.actorUser?.name) return item.actorUser.name;
    if (item.actorUserId) return `Usuário #${item.actorUserId}`;
    return "Usuário";
  }

  if (item.actorType === "public_share") {
    return item.publicShareId
      ? `Link público #${item.publicShareId}`
      : "Link público";
  }

  return "Sistema";
}

function prettyJson(value: unknown) {
  if (value == null) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function LogsPage() {
  const [items, setItems] = useState<AuditListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<AuditDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actorTypeFilter, setActorTypeFilter] = useState("");

  async function loadLogs(nextPage = page) {
    setError("");
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: "20",
      });

      if (search.trim()) params.set("search", search.trim());
      if (moduleFilter) params.set("module", moduleFilter);
      if (actorTypeFilter) params.set("actorType", actorTypeFilter);

      const response = await apiFetch(
        `/audit?${params.toString()}`,
        "GET",
      ) as AuditListResponse;

      setItems(response.items);
      setPagination(response.pagination);
      setPage(response.pagination.page);

      if (response.items.length === 0) {
        setSelectedId(null);
        setSelectedItem(null);
        return;
      }

      const nextSelectedId = response.items.some((item) => item.id === selectedId)
        ? selectedId
        : response.items[0].id;

      setSelectedId(nextSelectedId);
    } catch (err) {
      setItems([]);
      setSelectedId(null);
      setSelectedItem(null);
      setPagination({
        page: nextPage,
        pageSize: 20,
        total: 0,
        totalPages: 1,
      });
      setError(err instanceof Error ? err.message : "Falha ao carregar os logs.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDetail(id: number) {
    setDetailError("");
    setIsDetailLoading(true);

    try {
      const response = await apiFetch(`/audit/${id}`, "GET");
      setSelectedItem(response);
    } catch (err) {
      setSelectedItem(null);
      setDetailError(
        err instanceof Error ? err.message : "Falha ao carregar o log.",
      );
    } finally {
      setIsDetailLoading(false);
    }
  }

  useEffect(() => {
    loadLogs(1);
  }, [search, moduleFilter, actorTypeFilter]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedItem(null);
      return;
    }

    loadDetail(selectedId);
  }, [selectedId]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Administração
            </p>
            <h1 className="mt-1 text-lg font-semibold text-slate-900">
              Logs do sistema
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Auditoria.
            </p>
          </div>

        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.3fr)_180px_180px_auto]">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(searchInput);
                }
              }}
              placeholder="Buscar por módulo, ação, usuário, e-mail ou IP..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Todos os módulos</option>
            <option value="auth">Auth</option>
            <option value="clients">Clientes</option>
            <option value="events">Eventos</option>
            <option value="financial">Financeiro</option>
            <option value="financial-category">Categorias</option>
            <option value="storage">Storage</option>
            <option value="public-share">Links públicos</option>
            <option value="users">Usuários</option>
          </select>

          <select
            value={actorTypeFilter}
            onChange={(e) => setActorTypeFilter(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Todos os atores</option>
            <option value="user">Usuário</option>
            <option value="public_share">Link público</option>
            <option value="system">Sistema</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setPage(1);
                setSearch(searchInput);
              }}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-background px-4 text-sm font-semibold text-white cursor-pointer transition hover:opacity-90"
            >
              Buscar
            </button>
            <button
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setModuleFilter("");
                setActorTypeFilter("");
                loadLogs(1);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 cursor-pointer transition hover:bg-slate-50"
            >
              <RefreshCcw size={15} />
              Recarregar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Registros
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {isLoading
                ? "Carregando logs..."
                : `${pagination.total} ${pagination.total === 1 ? "registro" : "registros"
                } encontrados`}
            </p>
          </div>

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex h-full flex-col items-center justify-center px-6 py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
                <p className="mt-4 text-sm text-slate-500">Buscando logs...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-6">
                <p className="text-sm text-slate-500">
                  Nenhum log encontrado para os filtros atuais.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const active = selectedId === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full cursor-pointer px-4 py-4 text-left transition ${active ? "bg-slate-100" : "hover:bg-slate-50/80"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {item.module}
                            </span>
                            <p className="text-[15px] font-semibold text-slate-900">
                              {item.action}
                            </p>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                            <span>{formatActor(item)}</span>
                            {item.entityType && (
                              <span>
                                {item.entityType}
                                {item.entityId ? ` #${item.entityId}` : ""}
                              </span>
                            )}
                            {item.eventId && <span>Evento #{item.eventId}</span>}
                          </div>
                        </div>

                        <span className="shrink-0 text-xs text-slate-400">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">
              Página {pagination.page} de {pagination.totalPages}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => loadLogs(page - 1)}
                disabled={isLoading || page <= 1}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={15} />
                Anterior
              </button>
              <button
                onClick={() => loadLogs(page + 1)}
                disabled={isLoading || page >= pagination.totalPages}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Próxima
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Detalhes
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {selectedId ? `Log #${selectedId}` : "Selecione um registro"}
            </p>
          </div>

          <div className="flex-1 overflow-auto px-4 py-4">
            {detailError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {detailError}
              </div>
            )}

            {isDetailLoading ? (
              <div className="flex h-full flex-col items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
                <p className="mt-4 text-sm text-slate-500">
                  Carregando detalhes...
                </p>
              </div>
            ) : !selectedItem ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-500">
                  Selecione um log para ver os detalhes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Módulo
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {selectedItem.module}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Ação
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {selectedItem.action}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Ator
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {formatActor(selectedItem)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Data
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {formatDateTime(selectedItem.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    Contexto
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                    <p>Entity: {selectedItem.entityType ?? "—"}{selectedItem.entityId ? ` #${selectedItem.entityId}` : ""}</p>
                    <p>EventId: {selectedItem.eventId ?? "—"}</p>
                    <p>IP: {selectedItem.ip ?? "—"}</p>
                    <p>User-Agent: {selectedItem.userAgent ?? "—"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-950 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Antes
                    </p>
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap break-all text-xs text-slate-100">
                      {prettyJson(selectedItem.beforeData)}
                    </pre>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-950 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Depois
                    </p>
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap break-all text-xs text-slate-100">
                      {prettyJson(selectedItem.afterData)}
                    </pre>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-950 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Metadata
                    </p>
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap break-all text-xs text-slate-100">
                      {prettyJson(selectedItem.metadata)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
