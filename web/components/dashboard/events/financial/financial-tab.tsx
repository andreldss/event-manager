"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Search, RotateCcw, Plus } from "lucide-react";
import CreateTransactionModal from "./create-transaction-modal";

type Transaction = {
  id: number;
  type: "income" | "expense";
  status?: "planned" | "settled";
  amount: number | string;
  description: string;
  category?: { id: number; name: string } | null;
  createdAt?: string;
  paidAt?: string | null;
};

type Props = {
  eventId: number;
  onFinancialChanged: () => void;
  financialRefreshTrigger: number;
};

export default function FinancialTab({
  eventId,
  onFinancialChanged,
  financialRefreshTrigger,
}: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [settlingId, setSettlingId] = useState<number | null>(null);

  function formatBRL(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function parseAmount(value: number | string) {
    const n = typeof value === "string" ? Number(value) : value;
    return Number.isNaN(n) ? 0 : n;
  }

  function formatDate(value?: string | null) {
    if (!value) return "";

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";

    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  }

  async function loadTransactions() {
    setError("");
    setIsLoading(true);

    try {
      const response = await apiFetch(`/financial/${eventId}`, "GET");
      setTransactions(Array.isArray(response) ? response : []);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Falha de rede ou servidor fora do ar.");
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function markAsPaid(transactionId: number) {
    if (settlingId) return;

    setSettlingId(transactionId);
    setError("");

    try {
      await apiFetch(`/financial/${eventId}/${transactionId}/settle`, "PATCH");
      await loadTransactions();
      onFinancialChanged();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Falha ao marcar como pago.");
    } finally {
      setSettlingId(null);
    }
  }

  useEffect(() => {
    if (!eventId) return;
    loadTransactions();
  }, [eventId, financialRefreshTrigger]);

  const filteredTransactions = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return transactions;

    return transactions.filter(
      (t) =>
        (t.description || "").toLowerCase().includes(term) ||
        (t.category?.name || "").toLowerCase().includes(term),
    );
  }, [transactions, search]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let plannedExpense = 0;

    for (const t of filteredTransactions) {
      const amount = parseAmount(t.amount);

      if (t.type === "income") {
        income += amount;
      } else {
        if (t.status === "planned") plannedExpense += amount;
        else expense += amount;
      }
    }

    return { income, expense, plannedExpense };
  }, [filteredTransactions]);

  const balance = totals.income - totals.expense;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Financeiro
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Movimentações do evento
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
                placeholder="Buscar descrição ou categoria..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <button
              onClick={loadTransactions}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw size={15} />
              Recarregar
            </button>

            <button
              onClick={() => setOpenModal(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 cursor-pointer"
            >
              <Plus size={15} />
              Adicionar movimentação
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Entradas
            </p>
            <p className="mt-2 text-lg font-semibold text-emerald-700">
              {formatBRL(totals.income)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Saídas
            </p>
            <p className="mt-2 text-lg font-semibold text-rose-700">
              {formatBRL(totals.expense)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Programadas
            </p>
            <p className="mt-2 text-lg font-semibold text-amber-700">
              {formatBRL(totals.plannedExpense)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Saldo
            </p>
            <p
              className={`mt-2 text-lg font-semibold ${
                balance >= 0 ? "text-slate-900" : "text-rose-700"
              }`}
            >
              {formatBRL(balance)}
            </p>
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
                  ? "Carregando movimentações..."
                  : `${filteredTransactions.length} ${
                      filteredTransactions.length === 1
                        ? "movimentação encontrada"
                        : "movimentações encontradas"
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
                Buscando transações...
              </p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="px-4 py-6">
              <p className="text-sm text-slate-500">
                Nenhuma transação encontrada.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Tente ajustar a busca ou adicione uma nova movimentação.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTransactions.map((t) => {
                const amount = parseAmount(t.amount);
                const isIncome = t.type === "income";
                const isPlanned = t.status === "planned";

                const rowBg = isIncome
                  ? "bg-emerald-50/60 hover:bg-emerald-50"
                  : isPlanned
                    ? "bg-amber-50/60 hover:bg-amber-50"
                    : "bg-rose-50/60 hover:bg-rose-50";

                return (
                  <div
                    key={String(t.id)}
                    className={`group transition ${rowBg}`}
                  >
                    <div className="flex items-center justify-between gap-4 px-4 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[15px] font-semibold text-slate-900">
                            {t.description}
                          </p>

                          {isPlanned ? (
                            <span className="rounded-full border border-amber-200 bg-amber-100/70 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                              Programado
                            </span>
                          ) : (
                            <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              Recebido/Pago
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                          <span>
                            {t.category?.name
                              ? t.category.name
                              : "Sem categoria"}
                          </span>

                          {t.paidAt && (
                            <span>Data: {formatDate(t.paidAt)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        {isPlanned && (
                          <button
                            type="button"
                            onClick={() => markAsPaid(t.id)}
                            disabled={settlingId === t.id}
                            className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 cursor-pointer"
                          >
                            {settlingId === t.id
                              ? "Salvando..."
                              : "Marcar como pago"}
                          </button>
                        )}

                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold ${
                              isIncome
                                ? "text-emerald-700"
                                : isPlanned
                                  ? "text-amber-700"
                                  : "text-rose-700"
                            }`}
                          >
                            {isIncome ? "+" : "-"} {formatBRL(amount)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {isIncome
                              ? "Entrada"
                              : isPlanned
                                ? "Saída programada"
                                : "Saída"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CreateTransactionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={() => {
          loadTransactions();
          onFinancialChanged();
        }}
        eventId={eventId}
      />
    </div>
  );
}
