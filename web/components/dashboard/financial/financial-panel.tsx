"use client";

import { Funnel, Plus, RotateCcw, Search } from "lucide-react";
import { useMemo } from "react";
import FinancialSummaryCards from "./financial-summary";
import FinancialTransactionsList from "./financial-list";
import FinancialFilterChips from "./financial-filter-chips";
import type {
  FinancialFilterValues,
  FinancialOption,
  Transaction,
} from "@/types/financial";

type Props = {
  title: string;
  subtitle: string;
  transactions: Transaction[];
  isLoading: boolean;
  error: string;
  filters: FinancialFilterValues;
  onFiltersChange: (value: FinancialFilterValues) => void;
  onReload: () => void;
  onAdd: () => void;
  onMarkAsPaid?: (transactionId: number) => void;
  settlingId: number | null;
  showEventName?: boolean;
  addButtonLabel?: string;
  availableEvents?: FinancialOption[];
  availableCategories?: FinancialOption[];
  compactFilters?: boolean;
  onOpenFiltersModal?: () => void;
};

export default function FinancialPanel({
  title,
  subtitle,
  transactions,
  isLoading,
  error,
  filters,
  onFiltersChange,
  onReload,
  onAdd,
  onMarkAsPaid,
  settlingId,
  showEventName = false,
  addButtonLabel = "Adicionar movimentação",
  availableEvents = [],
  availableCategories = [],
  compactFilters = false,
  onOpenFiltersModal,
}: Props) {
  function updateFilter<K extends keyof FinancialFilterValues>(
    key: K,
    value: FinancialFilterValues[K],
  ) {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  }

  function clearFilters() {
    onFiltersChange({
      search: "",
      type: "",
      status: "",
      eventId: "",
      categoryId: "",
      startDate: "",
      endDate: "",
    });
  }

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

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const description = (t.description || "").toLowerCase();
      const categoryName = (t.category?.name || "").toLowerCase();
      const eventName = (t.event?.name || "").toLowerCase();

      const matchesSearch = filters.search
        ? description.includes(filters.search.toLowerCase()) ||
          categoryName.includes(filters.search.toLowerCase()) ||
          eventName.includes(filters.search.toLowerCase())
        : true;

      const matchesType = filters.type ? t.type === filters.type : true;
      const matchesStatus = filters.status ? t.status === filters.status : true;
      const matchesEvent = filters.eventId
        ? String(t.eventId) === filters.eventId
        : true;
      const matchesCategory = filters.categoryId
        ? String(t.category?.id || "") === filters.categoryId
        : true;

      const compareDate = t.paidAt || t.createdAt || "";
      const matchesStartDate = filters.startDate
        ? compareDate >= filters.startDate
        : true;
      const matchesEndDate = filters.endDate
        ? compareDate <= `${filters.endDate}T23:59:59.999Z`
        : true;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesEvent &&
        matchesCategory &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [transactions, filters]);

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
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={onReload}
              className="cursor-pointer inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw size={15} />
              Recarregar
            </button>

            <button
              onClick={onAdd}
              className="cursor-pointer inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <Plus size={15} />
              {addButtonLabel}
            </button>
          </div>
        </div>

        {compactFilters ? (
          <>
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  placeholder="Buscar descrição, categoria ou evento..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onOpenFiltersModal}
                  className="cursor-pointer inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Funnel size={15} />
                  Filtros
                </button>

                <button
                  onClick={clearFilters}
                  className="cursor-pointer inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Limpar
                </button>
              </div>
            </div>

            <FinancialFilterChips
              filters={filters}
              availableEvents={availableEvents}
              availableCategories={availableCategories}
            />
          </>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative md:col-span-2 xl:col-span-2">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                placeholder="Buscar descrição ou categoria..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <select
              value={filters.type}
              onChange={(e) => updateFilter("type", e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Todos os tipos</option>
              <option value="income">Entradas</option>
              <option value="expense">Saídas</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Todos os status</option>
              <option value="settled">Pago / Recebido</option>
              <option value="planned">Programado</option>
            </select>
          </div>
        )}

        <FinancialSummaryCards
          income={totals.income}
          expense={totals.expense}
          plannedExpense={totals.plannedExpense}
          balance={balance}
          formatBRL={formatBRL}
        />
      </div>

      {error && (
        <div className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <FinancialTransactionsList
        transactions={filteredTransactions}
        isLoading={isLoading}
        settlingId={settlingId}
        onMarkAsPaid={onMarkAsPaid}
        showEventName={showEventName}
        formatBRL={formatBRL}
        formatDate={formatDate}
        parseAmount={parseAmount}
      />
    </div>
  );
}
