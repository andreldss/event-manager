"use client";

import { X } from "lucide-react";
import type { FinancialFilterValues, FinancialOption } from "@/types/financial";

type Props = {
  open: boolean;
  onClose: () => void;
  draftFilters: FinancialFilterValues;
  onDraftFiltersChange: (value: FinancialFilterValues) => void;
  onApply: () => void;
  onClear: () => void;
  availableEvents: FinancialOption[];
  availableCategories: FinancialOption[];
};

export default function GlobalFinancialFiltersModal({
  open,
  onClose,
  draftFilters,
  onDraftFiltersChange,
  onApply,
  onClear,
  availableEvents,
  availableCategories,
}: Props) {
  function updateField<K extends keyof FinancialFilterValues>(
    key: K,
    value: FinancialFilterValues[K],
  ) {
    onDraftFiltersChange({
      ...draftFilters,
      [key]: value,
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Filtros
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              Filtrar movimentações
            </h3>
          </div>

          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Evento
            </label>
            <select
              value={draftFilters.eventId}
              onChange={(e) => updateField("eventId", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Todos os eventos</option>
              {availableEvents.map((event) => (
                <option key={event.id} value={String(event.id)}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Categoria
            </label>
            <select
              value={draftFilters.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Todas as categorias</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tipo
            </label>
            <select
              value={draftFilters.type}
              onChange={(e) => updateField("type", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Todos os tipos</option>
              <option value="income">Entradas</option>
              <option value="expense">Saídas</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              value={draftFilters.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Todos os status</option>
              <option value="settled">Pago / Recebido</option>
              <option value="planned">Programado</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Data inicial
            </label>
            <input
              type="date"
              value={draftFilters.startDate}
              onChange={(e) => updateField("startDate", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Data final
            </label>
            <input
              type="date"
              value={draftFilters.endDate}
              onChange={(e) => updateField("endDate", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            onClick={onClear}
            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Limpar
          </button>

          <button
            onClick={onApply}
            className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
}
