'use client';

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

export default function CreateTransactionModal({ open, onClose, onCreated, eventId }: CreateTransactionModalProps) {

    const [type, setType] = useState<'income' | 'expense'>('income');
    const [status, setStatus] = useState<'planned' | 'settled'>('planned');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paidAt, setPaidAt] = useState('');

    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [categoryQuery, setCategoryQuery] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    function setDefaults() {
        setType('income');
        setStatus('settled');
        setDescription('');
        setAmount('');
        setPaidAt('');
        setCategoryId(null);
        setCategoryOpen(false);
        setCategoryQuery('');

        setError('');
        setLoading(false);
    }

    async function fetchCategories() {
        setError('');

        try {
            const response = await apiFetch('/financial-category', 'GET');
            setCategories(Array.isArray(response) ? response : []);
        } catch (err) {
            setCategories([]);
        }
    }

    const filteredCategories = useMemo(() => {
        const q = categoryQuery.trim().toLowerCase();
        if (!q) return categories;

        return categories.filter(c => (c.name || '').toLowerCase().includes(q));
    }, [categories, categoryQuery]);

    function parseMoney(input: string) {
        const raw = input
            .replaceAll('.', '')
            .replace(',', '.')
            .replace(/[^\d.-]/g, '')
            .trim();

        if (!raw) return null;

        const n = Number(raw);
        if (Number.isNaN(n)) return null;
        if (n <= 0) return null;
        return n;
    }

    async function createTransaction() {
        if (!eventId) return;

        const desc = description.trim();
        const parsed = parseMoney(amount);

        if (!desc) {
            setError('Descrição obrigatória.');
            return;
        }

        if (parsed === null) {
            setError('Valor inválido.');
            return;
        }

        if (!categoryId) {
            setError('Selecione uma categoria.');
            return;
        }

        setLoading(true);
        setError('');

        const finalStatus = type === 'income' ? 'settled' : status;
        const finalPaidAt = type === 'income' ? null : (finalStatus === 'settled' ? (paidAt || null) : null);

        try {
            await apiFetch(`/financial/${eventId}`, 'POST', {
                type,
                status: finalStatus,
                description: desc,
                amount: parsed,
                paidAt: finalPaidAt,
                categoryId,
            });

            setDefaults();
            onClose();
            if (onCreated) onCreated();
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('Falha ao criar movimentação.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (open) {
            fetchCategories();
        } 
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">

            <div
                className="absolute inset-0 bg-black/40"
                onClick={() => {
                    if (!loading) setDefaults(); onClose(); 
                }}
            />

            <div className="relative w-[560px] max-w-[92vw] bg-white rounded-xl shadow-lg border p-5">

                <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="text-lg font-bold text-background">Nova movimentação</h2>

                    <button
                        onClick={() => {
                            if (!loading) setDefaults(); onClose();
                        }}
                        className="p-1 rounded hover:bg-gray-100 transition"
                        aria-label="Fechar"
                    >
                        <X />
                    </button>
                </div>

                <div className="flex flex-col gap-3">

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={`flex-1 cursor-pointer py-2 rounded-lg border font-semibold transition ${type === 'income' ? 'bg-green-100 border-green-300' : 'bg-white hover:bg-gray-50'}`}
                            disabled={loading}
                        >
                            Entrada
                        </button>

                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={`flex-1 cursor-pointer py-2 rounded-lg border font-semibold transition ${type === 'expense' ? 'bg-red-100 border-red-300' : 'bg-white hover:bg-gray-50'}`}
                            disabled={loading}
                        >
                            Saída
                        </button>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-background">Descrição</span>
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                            placeholder="Ex: DJ, iluminação, aluguel do salão..."
                            disabled={loading}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-background">Valor</span>
                        <input
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                            placeholder="0,00"
                            inputMode="decimal"
                            disabled={loading}
                        />
                    </div>

                    <div className="relative" tabIndex={0} onBlur={() => setCategoryOpen(false)}>
                        <span className="text-sm text-background">Categoria*</span>

                        <input
                            type="text"
                            value={categoryOpen ? categoryQuery : categories.find(c => c.id === categoryId)?.name || ''}
                            onFocus={() => setCategoryOpen(true)}
                            onChange={(e) => {
                                setCategoryQuery(e.target.value);
                                setCategoryOpen(true);
                            }}
                            placeholder="Selecione uma categoria..."
                            className="mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                            disabled={loading}
                        />

                        {categoryOpen && (
                            <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border rounded-lg shadow">
                                {filteredCategories.length === 0 && (
                                    <div className="px-4 py-2 text-sm text-gray-500">
                                        Selecione uma categoria válida.
                                    </div>
                                )}

                                {filteredCategories.map((c) => (
                                    <div
                                        key={c.id}
                                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                        onMouseDown={() => {
                                            setCategoryId(c.id);
                                            setCategoryQuery('');
                                            setCategoryOpen(false);
                                        }}
                                    >
                                        {c.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {type === 'expense' ? (
                        <>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStatus('settled');
                                    }}
                                    className={`flex-1 cursor-pointer py-2 rounded-lg border font-semibold transition ${status === 'settled' ? 'bg-background text-white' : 'bg-white hover:bg-gray-50 text-background'}`}
                                    disabled={loading}
                                >
                                    Pago
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setStatus('planned');
                                        setPaidAt('');
                                    }}
                                    className={`flex-1 cursor-pointer py-2 rounded-lg border font-semibold transition ${status === 'planned' ? 'bg-background text-white' : 'bg-white hover:bg-gray-50 text-background'}`}
                                    disabled={loading}
                                >
                                    Agendado
                                </button>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-background">Data (opcional)</span>
                                <input
                                    type="date"
                                    value={paidAt}
                                    onChange={(e) => setPaidAt(e.target.value)}
                                    className={`px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 ${status === 'planned' ? 'opacity-50' : ''}`}
                                    disabled={loading || status === 'planned'}
                                />
                            </div>
                        </>
                    ) : null}

                    {error ? (
                        <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                            {error}
                        </div>
                    ) : null}

                    <div className="flex justify-center gap-2 mt-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (!loading) setDefaults(); onClose();
                            }}
                            className="px-4 py-2 cursor-pointer rounded-lg border bg-white hover:bg-gray-50 font-semibold transition"
                            disabled={loading}
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            onClick={createTransaction}
                            className="px-4 py-2 cursor-pointer rounded-lg bg-background text-white hover:opacity-90 font-semibold transition disabled:opacity-60"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
