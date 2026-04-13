import type { Transaction } from "@/types/financial";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  transactions: Transaction[];
  isLoading: boolean;
  isFetchingMore?: boolean;
  hasMore?: boolean;
  loadMoreRef?: React.RefObject<HTMLDivElement | null>;
  settlingId: number | null;
  onMarkAsPaid?: (transactionId: number) => void;
  showEventName?: boolean;
  formatBRL: (value: number) => string;
  formatDate: (value?: string | null) => string;
  parseAmount: (value: number | string) => number;
  totalCount?: number;
  canManageTransactions?: boolean;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transaction: Transaction) => void;
};

export default function FinancialTransactionsList({
  transactions,
  isLoading,
  isFetchingMore = false,
  hasMore = false,
  loadMoreRef,
  settlingId,
  onMarkAsPaid,
  showEventName = false,
  formatBRL,
  formatDate,
  parseAmount,
  totalCount,
  canManageTransactions = false,
  onEditTransaction,
  onDeleteTransaction,
}: Props) {
  const effectiveTotal = totalCount ?? transactions.length;
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!menuRef.current?.contains(target)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Lista
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {isLoading
              ? "Carregando movimentações..."
              : `${effectiveTotal} ${
                  effectiveTotal === 1
                    ? "movimentação encontrada"
                    : "movimentações encontradas"
                }`}
          </p>
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
        ) : transactions.length === 0 ? (
          <div className="px-4 py-6">
            <p className="text-sm text-slate-500">
              Nenhuma transação encontrada.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Tente ajustar os filtros ou adicione uma nova movimentação.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((t) => {
              const amount = parseAmount(t.amount);
              const isIncome = t.type === "income";
              const isPlanned = t.status === "planned";

              const rowBg = isIncome
                ? "bg-emerald-50/60 hover:bg-emerald-50"
                : isPlanned
                  ? "bg-amber-50/60 hover:bg-amber-50"
                  : "bg-rose-50/60 hover:bg-rose-50";

              return (
                <div key={String(t.id)} className={`group transition ${rowBg}`}>
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

                        {t.sourceType === "collection" && (
                          <span className="rounded-full border border-sky-200 bg-sky-100/70 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                            Coleta
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                        <span>
                          {t.category?.name ? t.category.name : "Sem categoria"}
                        </span>

                        {showEventName && t.event?.name && (
                          <span>Evento: {t.event.name}</span>
                        )}

                        {t.paidAt && <span>Data: {formatDate(t.paidAt)}</span>}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {isPlanned && onMarkAsPaid && (
                        <button
                          type="button"
                          onClick={() => onMarkAsPaid(t.id)}
                          disabled={settlingId === t.id}
                          className="cursor-pointer rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
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

                      {canManageTransactions && (
                        <div ref={openMenuId === t.id ? menuRef : undefined} className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId((prev) => (prev === t.id ? null : t.id))
                            }
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                          >
                            <Ellipsis size={16} />
                          </button>

                          {openMenuId === t.id && (
                            <div className="absolute right-0 top-10 z-20 min-w-[170px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onEditTransaction?.(t);
                                }}
                                className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                              >
                                <Pencil size={15} />
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onDeleteTransaction?.(t);
                                }}
                                className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm text-rose-700 transition hover:bg-rose-50"
                              >
                                <Trash2 size={15} />
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {hasMore && <div ref={loadMoreRef} className="h-1 w-full" />}

            {isFetchingMore && (
              <div className="px-4 py-4 text-center text-sm text-slate-500">
                Carregando mais movimentações...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
