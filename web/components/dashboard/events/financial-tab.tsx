'use client';

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ChevronRight } from "lucide-react";
import CreateTransactionModal from "./create-transaction-modal";
import { useParams } from "next/navigation";

type Transaction = {
    id: number;
    type: 'income' | 'expense';
    status?: 'planned' | 'settled';
    amount: number | string;
    description: string;
    category?: { id: number; name: string } | null;
    createdAt?: string;
    paidAt?: string | null;
};

export default function FinancialTab() {

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const params = useParams();
    const eventId = Number(params.id);

    function formatBRL(value: number) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function parseAmount(value: number | string) {
        const n = typeof value === 'string' ? Number(value) : value;
        return Number.isNaN(n) ? 0 : n;
    }

    async function loadTransactions() {
        setError('');
        setIsLoading(true);

        try {
            const response = await apiFetch(`/financial/${eventId}`, 'GET');
            setTransactions(Array.isArray(response) ? response : []);
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('Falha de rede ou servidor fora do ar.'); setTransactions([]);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadTransactions();
    }, []);

    const filteredTransactions = transactions.filter((t) =>
        (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.category?.name || '').toLowerCase().includes(search.toLowerCase())
    );

    const totals = useMemo(() => {
        let income = 0;
        let expense = 0;
        let plannedExpense = 0;

        for (const t of filteredTransactions) {
            const amount = parseAmount(t.amount);

            if (t.type === 'income') {
                income += amount;
            } else {
                if (t.status === 'planned') plannedExpense += amount;
                else expense += amount;
            }
        }

        return { income, expense, plannedExpense };
    }, [filteredTransactions]);

    return (
        <div className="flex flex-col gap-6 h-full min-h-0">

            <div className="flex items-end justify-between gap-4 w-full shrink-0">
                <div className="flex gap-3">
                    <button
                        onClick={loadTransactions}
                        className="py-2 px-4 text-sm bg-white hover:bg-gray-50 border font-semibold rounded-lg shadow-sm cursor-pointer"
                    >
                        Recarregar
                    </button>
                    <button
                        onClick={() => setOpenModal(true)}
                        className="py-2 px-4 text-sm bg-background text-white hover:opacity-90 border font-semibold rounded-lg shadow-sm cursor-pointer"
                    >
                        Adicionar Movimentação
                    </button>
                </div>

                <div>
                    <span className="text-sm text-background">Buscar</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mt-1 w-full text-sm px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400"
                        placeholder="Digite a descrição..."
                    />
                </div>
            </div>

            {error && (
                <div className="border border-red-300 bg-red-50 text-red-700 px-4 py-2 rounded-lg shrink-0">
                    {error}
                </div>
            )}

            <div className="flex-1 min-h-0 rounded-xl overflow-hidden">
                <div className="p-4 flex flex-col gap-3 h-full min-h-0">

                    <div className="px-4 py-3 border rounded-xl flex items-center justify-between shrink-0">
                        <div className="flex gap-3">
                            <p className="font-semibold">
                                {isLoading ? "Carregando..." : `${filteredTransactions.length} transação(ões)`}
                            </p>
                            {!isLoading && (
                                <div className="flex gap-3 text-sm">
                                    <span className="px-2 py-1 rounded-lg bg-green-100 border">
                                        Entradas: <b>{formatBRL(totals.income)}</b>
                                    </span>

                                    <span className="px-2 py-1 rounded-lg bg-red-100 border">
                                        Saídas: <b>{formatBRL(totals.expense)}</b>
                                    </span>

                                    <span className="px-2 py-1 rounded-lg bg-orange-100 border">
                                        Saídas programadas: <b>{formatBRL(totals.plannedExpense)}</b>
                                    </span>
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-background">Movimentações</p>
                    </div>

                    <div className="flex-1 min-h-0 overflow-auto rounded-xl">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center mt-5">
                                <div className="w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                                <div className="p-6 text-background text-gray-600">Buscando transações...</div>
                            </div>

                        ) : filteredTransactions.length === 0 ? (
                            <div className="p-6 text-background text-gray-600">
                                Nenhuma transação encontrada.
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredTransactions.map((t) => {
                                    const amount = parseAmount(t.amount);
                                    const isIncome = t.type === 'income';

                                    return (
                                        <div
                                            key={String(t.id)}
                                            className={`${t.status === 'planned' ? 'bg-orange-100 hover:bg-orange-300' : isIncome ? 'bg-green-100 hover:bg-green-300' : 'bg-red-100 hover:bg-red-300'} block transition text-sm cursor-pointer`}
                                        >
                                            <div className="px-4 py-4 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <div className="flex gap-2 items-center">
                                                        <p className="font-semibold text-[16px] text-background">
                                                            {t.description}
                                                        </p>
                                                        {t.status ? (
                                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/60 border">
                                                                {t.status === 'settled' ? 'Recebido/Pago' : 'Programado'}
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <p className="text-sm text-background">
                                                        {t.category?.name ? t.category.name : "Sem categoria"}
                                                        {t.paidAt ? ` | Data: ${new Date(t.paidAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}` : ""}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <p className="font-semibold text-background">
                                                        {isIncome ? '+' : '-'} {formatBRL(amount)}
                                                    </p>
                                                    <ChevronRight />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <CreateTransactionModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                onCreated={loadTransactions}
                eventId={eventId}
            />
        </div>
    );
}
