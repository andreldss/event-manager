type Props = {
  income: number;
  expense: number;
  plannedExpense: number;
  balance: number;
  formatBRL: (value: number) => string;
};

export default function FinancialSummaryCards({
  income,
  expense,
  plannedExpense,
  balance,
  formatBRL,
}: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Entradas
        </p>
        <p className="mt-2 text-lg font-semibold text-emerald-700">
          {formatBRL(income)}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Saídas
        </p>
        <p className="mt-2 text-lg font-semibold text-rose-700">
          {formatBRL(expense)}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Programadas
        </p>
        <p className="mt-2 text-lg font-semibold text-amber-700">
          {formatBRL(plannedExpense)}
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
  );
}
