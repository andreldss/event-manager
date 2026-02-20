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

export default function CreateFolderModal({ open, onClose, onCreated, eventId }: CreateTransactionModalProps) {

    const [folderName, setFolderName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    function setDefaults() {
        setFolderName('');

        setError('');
        setLoading(false);
    }

    async function createTransaction() {
        if (!eventId) return;

        const desc = folderName.trim();

        if (!desc) {
            setError('Descrição obrigatória.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await apiFetch(`/storage/${eventId}`, 'POST', {
                description: desc,
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
                    <h2 className="text-lg font-bold text-background">Nova pasta</h2>

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

                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-background">Nome</span>
                        <input
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            className="px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                            placeholder="Ex: DJ, iluminação, aluguel do salão..."
                            disabled={loading}
                        />
                    </div>

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
