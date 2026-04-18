"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FinancialChartCardProps = {
  canViewFinancial: boolean;
  chartData: {
    month: string;
    income: number;
    expense: number;
  }[];
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: any[];
  label?: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const income = Number(
    payload.find((item) => item.dataKey === "income")?.value ?? 0,
  );

  const expense = Number(
    payload.find((item) => item.dataKey === "expense")?.value ?? 0,
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>

      <p className="text-sm font-medium text-emerald-700">
        Entradas: {formatCurrency(income)}
      </p>

      <p className="text-sm font-medium text-rose-600">
        Saídas: {formatCurrency(expense)}
      </p>
    </div>
  );
}

export default function FinancialChartCard({
  canViewFinancial,
  chartData,
}: FinancialChartCardProps) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Financeiro
        </p>

        <h2 className="mt-1 text-base font-semibold text-slate-900">
          Entradas vs saídas por mês
        </h2>
      </div>

      {canViewFinancial ? (
        <>
          <div className="mb-4 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Entradas
            </span>

            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              Saídas
            </span>
          </div>

          <div className="h-[230px] min-h-[230px] w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width={600} height="90%">
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />

                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  width={56}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("pt-BR", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(Number(value ?? 0))
                  }
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip content={<ChartTooltip />} />

                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#gradIncome)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#10b981" }}
                />

                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fill="url(#gradExpense)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#f43f5e" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="flex h-[280px] min-h-[280px] items-center justify-center">
          <p className="text-sm text-slate-400">—</p>
        </div>
      )}
    </div>
  );
}
