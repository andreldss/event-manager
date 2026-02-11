'use client';

import { apiFetch } from '@/lib/api';
import { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type Point = {
    date: string;
    income: number;
    expense: number;
};

type EventChartProps = {
    eventId: number;
};

function formatBRL(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateBR(dateStr: string) {
  const normalized = dateStr.replace(' ', 'T') + 'Z';

  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return dateStr;

  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;

    const income = payload.find((p: any) => p.dataKey === 'income')?.value ?? 0;
    const expense = payload.find((p: any) => p.dataKey === 'expense')?.value ?? 0;

    return (
        <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500 mb-2">{label}</p>

            <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-6">
                    <span className="text-xs text-gray-600">Entradas</span>
                    <span className="text-sm font-semibold">{formatBRL(income)}</span>
                </div>

                <div className="flex items-center justify-between gap-6">
                    <span className="text-xs text-gray-600">Saídas</span>
                    <span className="text-sm font-semibold">{formatBRL(expense)}</span>
                </div>

                <div className="h-px bg-gray-100 my-2" />

                <div className="flex items-center justify-between gap-6">
                    <span className="text-xs text-gray-600">Saldo (dia)</span>
                    <span className="text-sm font-semibold">{formatBRL(income - expense)}</span>
                </div>
            </div>
        </div>
    );
}

export function EventChart({ eventId }: EventChartProps) {
    const [data, setData] = useState<Point[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    async function loadCashflow() {
        setError('');
        setIsLoading(true);

        try {
            const response = await apiFetch(`/financial/${eventId}/cashflow`, 'GET');
            setData(Array.isArray(response) ? response : []);
        } catch (err: any) {
            setError('Falha de rede ou servidor fora do ar.');
            setData([]);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadCashflow();
    }, [eventId]);

    return (
        <div className="h-full min-h-0 border rounded-2xl bg-white p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">Fluxo financeiro</h3>
                    <p className="text-xs text-gray-500">Entradas vs saídas por data</p>
                </div>
            </div>

            {error ? (
                <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-700">
                    {error}
                </div>
            ) : null}

            {isLoading ? (
                <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-700">
                    Carregando gráfico...
                </div>
            ) : null}

            {!isLoading && !error && data.length === 0 ? (
                <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-700">
                    Nenhum dado encontrado.
                </div>
            ) : null}

            <div className="h-[calc(100%-20%)] mt-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                            </linearGradient>

                            <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.22} />
                                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => formatDateBR(value)} />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            fontSize={12}
                            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
                        />

                        <Tooltip content={<CustomTooltip />} />

                        <Area
                            type="monotone"
                            dataKey="income"
                            stroke="#16a34a"
                            strokeWidth={2}
                            fill="url(#incomeFill)"
                            name="Entradas"
                            dot={false}
                            activeDot={{ r: 4 }}
                        />

                        <Area
                            type="monotone"
                            dataKey="expense"
                            stroke="#dc2626"
                            strokeWidth={2}
                            fill="url(#expenseFill)"
                            name="Saídas"
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
