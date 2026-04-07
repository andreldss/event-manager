"use client";

import FinancialChartCard from "@/components/dashboard/financial-chart";
import SummaryCard from "@/components/dashboard/summary-card";
import UpcomingEventsCard from "@/components/dashboard/upcoming-events";
import { apiFetch } from "@/lib/api";
import { CalendarDays, DollarSign, Receipt, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
        <SummaryCard
          title="Entradas do mês"
          value={
            canViewFinancial && data?.monthSummary
              ? formatCurrency(data.monthSummary.income)
              : "—"
          }
          icon={<TrendingUp size={18} />}
        />

        <SummaryCard
          title="Saídas do mês"
          value={
            canViewFinancial && data?.monthSummary
              ? formatCurrency(data.monthSummary.expense)
              : "—"
          }
          icon={<Receipt size={18} />}
        />

        <SummaryCard
          title="Saldo do mês"
          value={
            canViewFinancial && data?.monthSummary
              ? formatCurrency(data.monthSummary.balance)
              : "—"
          }
          icon={<DollarSign size={18} />}
        />

        <SummaryCard
          title="Eventos no mês"
          value={
            canViewEvents && data?.monthSummary?.eventsCount != null
              ? String(data.monthSummary.eventsCount)
              : "—"
          }
          icon={<CalendarDays size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_0.9fr]">
        <FinancialChartCard
          canViewFinancial={canViewFinancial}
          chartData={data?.monthlyChart ?? []}
        />

        <UpcomingEventsCard
          canViewEvents={canViewEvents}
          events={data?.upcomingEvents ?? []}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
}
