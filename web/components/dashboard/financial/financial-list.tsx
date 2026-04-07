import type { Transaction } from "@/types/financial";

type Props = {
  transactions: Transaction[];
  isLoading: boolean;
  settlingId: number | null;
  onMarkAsPaid?: (transactionId: number) => void;
  showEventName?: boolean;
  formatBRL: (value: number) => string;
  formatDate: (value?: string | null) => string;
  parseAmount: (value: number | string) => number;
};

export default function FinancialTransactionsList({
  transactions,
  isLoading,
  settlingId,
  onMarkAsPaid,
  showEventName = false,
  formatBRL,
  formatDate,
  parseAmount,
}: Props) {
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
              : `${transactions.length} ${
                  transactions.length === 1
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
