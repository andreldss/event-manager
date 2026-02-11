'use client';

import { useEffect, useState } from "react";
import { EventChart } from "./charts/event-charts";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

type ChecklistItem = {
    id: string;
    text: string;
    date: string;
    done: boolean;
};

export default function OverviewTab() {

    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [newText, setNewText] = useState('');
    const [newDate, setNewDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const params = useParams();
    const eventId = Number(params.id);

    async function addItem() {
        if (loading) return;

        setError('');
        setLoading(true);

        const text = newText.trim();
        if (!text) {
            setError('Texto do checklist não pode ser vazio.');
            setLoading(false);
            return;
        }

        try {
            await apiFetch(`/events/${eventId}/checklist`, 'POST', { text, date: newDate });
            setNewDate('');
            setNewText('');
            loadChecklist();
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('Falha ao criar checklist.');
        } finally {
            setLoading(false);
        }
    }

    async function loadChecklist() {
        setError('');
        setLoading(true);

        try {
            const response = await apiFetch(`/events/${eventId}/checklist`, 'GET');
            setItems(Array.isArray(response) ? response : []);
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('Falha ao carregar checklist.');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    async function removeItem(id: string) {
        if (loading) return;

        setError('');
        setLoading(true);

        try {
            await apiFetch(`/events/${eventId}/checklist/${id}`, 'DELETE');
            loadChecklist();
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('Falha ao remover checklist.');
        } finally {
            setLoading(false);
        }
    }

    async function toggleDone(id: string) {
        if (loading) return;
        setError('');

        try {
            await apiFetch(`/events/${eventId}/checklist/${id}/done`, 'PATCH');
            loadChecklist();
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('Falha ao atualizar checklist como concluído.');
        }
    }

    useEffect(() => {
        loadChecklist();
    }, [eventId]);

    return (
        <div className="h-full min-h-0 grid grid-cols-4 gap-6">

            <div className="col-span-4 lg:col-span-1 flex flex-col min-h-0 gap-6">

                <div className="flex flex-col min-h-0 flex-[2]">
                    <div className="flex flex-col gap-2 mb-3">
                        <input
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            placeholder="Novo item para checklist..."
                            className="w-full px-4 py-3 rounded-xl border bg-white text-sm outline-none focus:ring-2 focus:ring-gray-200"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') addItem();
                            }}
                        />

                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-xl border bg-white text-sm outline-none focus:ring-2 focus:ring-gray-200"
                            />

                            <button
                                onClick={addItem}
                                className="px-4 py-3 rounded-xl text-sm font-medium bg-background text-white hover:opacity-90 transition cursor-pointer active:opacity-80"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 border rounded-2xl bg-white overflow-hidden">
                        <div className="h-full overflow-auto">

                            {error && (
                                <div className="border border-red-300 bg-red-50 text-red-700 px-4 py-2 rounded-lg m-4">
                                    {error}
                                </div>
                            )}

                            {items.map(item => (
                                <div
                                    key={item.id}
                                    className="px-4 py-3 flex items-center gap-3 w-full justify-between"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <input
                                            type="checkbox"
                                            checked={!!item.done}
                                            onChange={() => toggleDone(item.id)}
                                            className="w-4 h-4 cursor-pointer"
                                        />

                                        <p
                                            className={[
                                                "text-sm text-background break-words",
                                                item.done ? "line-through opacity-60" : ""
                                            ].join(' ')}
                                        >
                                            {item.text}
                                        </p>
                                    </div>

                                    <p className="text-sm text-background">
                                        {item.date
                                            ? new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                                            : ""
                                        }
                                    </p>

                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="px-3 py-2 rounded-xl text-sm bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                                    >
                                        X
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col min-h-0 flex-[1] border rounded-2xl bg-white overflow-hidden">
                    <div className="p-4 border-b flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-background">
                                Grupos do evento
                            </h3>
                            <p className="text-xs text-gray-500">
                                Ex: 301, 302, VIP
                            </p>
                        </div>

                        <button
                            type="button"
                            className="px-3 py-2 rounded-xl text-sm font-medium bg-background text-white hover:opacity-90 transition"
                        >
                            + Grupo
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-auto p-4 text-sm text-gray-600">
                        Nenhum grupo cadastrado.
                    </div>
                </div>

            </div>

            <div className="hidden lg:block lg:col-span-3 min-h-0">
                <EventChart eventId={eventId} />
            </div>

        </div>
    );
}
