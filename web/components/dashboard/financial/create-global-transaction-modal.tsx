"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Category = {
  id: number;
  name: string;
};

type EventOption = {
  id: number;
  name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateGlobalTransactionModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [eventId, setEventId] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [status, setStatus] = useState<"planned" | "settled">("planned");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  function resetForm() {
    setEventId("");
    setType("expense");
    setStatus("planned");
    setDescription("");
    setAmount("");
    setCategoryId("");
    setPaidAt("");
    setError("");
  }

  async function loadInitialData() {
    try {
      const [categoriesResponse, eventsResponse] = await Promise.all([
        apiFetch("/financial-categories", "GET"),
        apiFetch("/events", "GET"),
      ]);

      setCategories(
        Array.isArray(categoriesResponse) ? categoriesResponse : [],
      );
      setEvents(Array.isArray(eventsResponse) ? eventsResponse : []);
    } catch {
      setCategories([]);
      setEvents([]);
    }
  }

  async function handleSubmit() {
    setError("");
    setIsSaving(true);

    try {
      await apiFetch("/financial", "POST", {
        eventId: Number(eventId),
        type,
        status,
        description,
        amount: Number(amount),
        categoryId: categoryId ? Number(categoryId) : null,
        paidAt: status === "settled" && paidAt ? paidAt : null,
      });

      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar.");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    loadInitialData();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Nova movimentação
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            Adicionar movimentação global
          </h3>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Evento
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Selecione um evento</option>
              {events.map((event) => (
                <option key={event.id} value={String(event.id)}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "income" | "expense")
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="income">Entrada</option>
                <option value="expense">Saída</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "planned" | "settled")
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="planned">Programado</option>
                <option value="settled">Recebido/Pago</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Descrição
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Valor
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">Sem categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {status === "settled" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Data do pagamento/recebimento
              </label>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
