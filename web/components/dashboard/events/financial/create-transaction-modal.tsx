"use client";

import { apiFetch } from "@/lib/api";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CreateTransactionModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  eventId: number;
};

type Category = {
  id: number;
  name: string;
};

export default function CreateTransactionModal({
  open,
  onClose,
  onCreated,
  eventId,
}: CreateTransactionModalProps) {
  const [type, setType] = useState<"income" | "expense">("income");
  const [status, setStatus] = useState<"planned" | "settled">("planned");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function setDefaults() {
    setType("income");
    setStatus("settled");
    setDescription("");
    setAmount("");
    setPaidAt("");
    setCategoryId(null);
    setCategoryOpen(false);
    setCategoryQuery("");
    setError("");
    setLoading(false);
  }

  async function fetchCategories() {
    try {
      const response = await apiFetch("/financial-category", "GET");
      setCategories(Array.isArray(response) ? response : []);
    } catch {
      setCategories([]);
    }
  }

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return categories;

    return categories.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [categories, categoryQuery]);

  function parseMoney(input: string) {
    const raw = input
      .replaceAll(".", "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
      .trim();

    if (!raw) return null;

    const n = Number(raw);
    if (Number.isNaN(n) || n <= 0) return null;

    return n;
  }

  async function createTransaction() {
    if (!eventId) return;

    const desc = description.trim();
    const parsed = parseMoney(amount);

    if (!desc) return setError("Descrição obrigatória.");
    if (parsed === null) return setError("Valor inválido.");
    if (!categoryId) return setError("Selecione uma categoria.");

    setLoading(true);
    setError("");

    const finalStatus = type === "income" ? "settled" : status;

    const finalPaidAt =
      type === "income"
        ? null
        : finalStatus === "settled"
          ? paidAt || null
          : null;

    try {
      await apiFetch(`/financial/event/${eventId}`, "POST", {
        type,
        status: finalStatus,
        description: desc,
        amount: parsed,
        paidAt: finalPaidAt,
        categoryId,
      });

      setDefaults();
      onClose();
      onCreated?.();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Falha ao criar movimentação.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) fetchCategories();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (!loading) setDefaults();
          onClose();
        }}
      />

      <div className="relative w-[560px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Nova movimentação
          </h2>

          <button
            onClick={() => {
              if (!loading) setDefaults();
              onClose();
            }}
            className="cursor-pointer rounded p-1 text-slate-500 transition hover:bg-slate-100"
          >
            <X />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setType("income")}
              className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition cursor-pointer ${
                type === "income"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Entrada
            </button>

            <button
              onClick={() => setType("expense")}
              className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition cursor-pointer ${
                type === "expense"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Saída
            </button>
          </div>

          <div>
            <label className="text-sm text-slate-600">Descrição</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
              placeholder={
                type === "income"
                  ? "Ex: pagamento recebido"
                  : "Ex: fornecedor, estrutura..."
              }
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">Valor</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
              placeholder="0,00"
              inputMode="decimal"
            />
          </div>

          <div
            className="relative"
            tabIndex={0}
            onBlur={() => setCategoryOpen(false)}
          >
            <label className="text-sm text-slate-600">Categoria</label>

            <input
              value={
                categoryOpen
                  ? categoryQuery
                  : categories.find((c) => c.id === categoryId)?.name || ""
              }
              onFocus={() => setCategoryOpen(true)}
              onChange={(e) => {
                setCategoryQuery(e.target.value);
                setCategoryOpen(true);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
              placeholder="Selecione uma categoria..."
            />

            {categoryOpen && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                {filteredCategories.map((c) => (
                  <div
                    key={c.id}
                    onMouseDown={() => {
                      setCategoryId(c.id);
                      setCategoryOpen(false);
                      setCategoryQuery("");
                    }}
                    className="cursor-pointer px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {type === "expense" && (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatus("settled")}
                  className={`flex-1 rounded-xl border py-2 text-sm font-semibold cursor-pointer ${
                    status === "settled"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600"
                  }`}
                >
                  Pago
                </button>

                <button
                  onClick={() => {
                    setStatus("planned");
                    setPaidAt("");
                  }}
                  className={`flex-1 rounded-xl border py-2 text-sm font-semibold cursor-pointer ${
                    status === "planned"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600"
                  }`}
                >
                  Agendado
                </button>
              </div>

              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                disabled={status === "planned"}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
              />
            </>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              onClick={createTransaction}
              disabled={loading}
              className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
