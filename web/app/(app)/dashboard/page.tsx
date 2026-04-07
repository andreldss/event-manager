"use client";

import { apiFetch } from "@/lib/api";
import { CalendarDays, DollarSign, Receipt, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DashboardSummaryResponse = {
  permissions: {
    canViewFinancial: boolean;
    canViewEvents: boolean;
  };
  monthSummary: {
    income: number;
    expense: number;
    balance: number;
    eventsCount: number | null;
  } | null;
  monthlyChart: {
    month: string;
    income: number;
    expense: number;
  }[];
  upcomingEvents: {
    id: number;
    name: string;
    date: string | null;
    clientName: string | null;
    location: string | null;
  }[];
  recentEvents: {
    id: number;
    name: string;
    createdAt: string;
    clientName: string | null;
  }[];
};

type SummaryCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Sem data";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Data inválida";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function SummaryCard({ title, value, icon }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Resumo
          </p>
          <h3 className="mt-1 text-sm font-medium text-slate-500">{title}</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600">
          {icon}
        </div>
      </div>
      <p className="mt-6 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const income = Number(
    payload.find((p: any) => p.dataKey === "income")?.value ?? 0,
  );
  const expense = Number(
    payload.find((p: any) => p.dataKey === "expense")?.value ?? 0,
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setError("");
    setIsLoading(true);
    try {
      const response = await apiFetch("/dashboard/summary", "GET");
      setData(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao carregar o dashboard.",
      );
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const canViewFinancial = data?.permissions.canViewFinancial ?? false;
  const canViewEvents = data?.permissions.canViewEvents ?? false;

  const cards = useMemo(
    (): SummaryCardProps[] => [
      {
        title: "Entradas do mês",
        value:
          canViewFinancial && data?.monthSummary
            ? formatCurrency(data.monthSummary.income)
            : "—",
        icon: <TrendingUp size={18} />,
      },
      {
        title: "Saídas do mês",
        value:
          canViewFinancial && data?.monthSummary
            ? formatCurrency(data.monthSummary.expense)
            : "—",
        icon: <Receipt size={18} />,
      },
      {
        title: "Saldo do mês",
        value:
          canViewFinancial && data?.monthSummary
            ? formatCurrency(data.monthSummary.balance)
            : "—",
        icon: <DollarSign size={18} />,
      },
      {
        title: "Eventos no mês",
        value:
          canViewEvents && data?.monthSummary?.eventsCount != null
            ? String(data.monthSummary.eventsCount)
            : "—",
        icon: <CalendarDays size={18} />,
      },
    ],
    [data, canViewFinancial, canViewEvents],
  );

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Dashboard
          </p>
          <h1 className="mt-1 text-lg font-semibold text-slate-900">
            Visão geral da operação
          </h1>
        </div>
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
            <p className="text-sm text-slate-500">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Dashboard
        </p>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">
          Visão geral da operação
        </h1>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <SummaryCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
          />
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5">
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

              <div className="h-[280px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data?.monthlyChart ?? []}
                    margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="gradIncome"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="gradExpense"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f43f5e"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f43f5e"
                          stopOpacity={0}
                        />
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
                      tickFormatter={(v) =>
                        new Intl.NumberFormat("pt-BR", {
                          notation: "compact",
                          maximumFractionDigits: 1,
                        }).format(Number(v ?? 0))
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
            <div className="flex h-[280px] items-center justify-center">
              <p className="text-sm text-slate-400">—</p>
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 shrink-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Agenda
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              Próximos eventos
            </h2>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {!canViewEvents ? (
              <p className="text-sm text-slate-400">—</p>
            ) : (data?.upcomingEvents?.length ?? 0) === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum evento próximo encontrado.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {data?.upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/dashboard/events/${event.id}`}
                    className="block py-3 transition first:pt-0 last:pb-0 hover:opacity-80"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {event.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                      {event.clientName && <span>{event.clientName}</span>}
                      {event.clientName && event.date && (
                        <span className="text-slate-300">·</span>
                      )}
                      {event.date && <span>{formatDate(event.date)}</span>}
                      {event.location && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span>{event.location}</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
