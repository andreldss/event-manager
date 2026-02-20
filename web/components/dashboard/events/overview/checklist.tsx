import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

type ChecklistItem = {
    id: string;
    text: string;
    date: string;
    done: boolean;
};

type EventChartProps = {
    eventId: number;
};

export default function OverviewChecklist({ eventId }: EventChartProps) {
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [newChecklistText, setNewChecklistText] = useState('');
    const [newChecklistDate, setNewChecklistDate] = useState('');

    async function addChecklistItem() {
        if (loading) return;

        setError('');
        setLoading(true);

        const text = newChecklistText.trim();
        if (!text) {
            setError('Texto do checklist não pode ser vazio.');
            setLoading(false);
            return;
        }

        try {
            await apiFetch(`/events/${eventId}/checklist`, 'POST', { text, date: newChecklistDate });
            setNewChecklistDate('');
            setNewChecklistText('');
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
            setChecklistItems(Array.isArray(response) ? response : []);
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('Falha ao carregar checklist.');
            setChecklistItems([]);
        } finally {
            setLoading(false);
        }
    }

    async function removeChecklistItem(id: string) {
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

        <div className="flex flex-col min-h-0 flex-[2]">
            <div className="flex flex-col gap-2 mb-3">
                <input
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    placeholder="Novo item para checklist..."
                    className="w-full px-4 py-3 rounded-xl border bg-white text-sm outline-none focus:ring-2 focus:ring-gray-200"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') addChecklistItem();
                    }}
                />

                <div className="flex gap-2">
                    <input
                        type="date"
                        value={newChecklistDate}
                        onChange={(e) => setNewChecklistDate(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border bg-white text-sm outline-none focus:ring-2 focus:ring-gray-200"
                    />

                    <button
                        onClick={addChecklistItem}
                        className="px-4 py-3 rounded-xl text-sm font-medium bg-background text-white hover:opacity-90 transition cursor-pointer active:opacity-80"
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 border rounded-2xl bg-white overflow-hidden text-sm">
                <div className="h-full overflow-auto">

                    {error && (
                        <div className="border border-red-300 bg-red-50 text-red-700 px-4 py-2 rounded-lg m-4">
                            {error}
                        </div>
                    )}

                    {checklistItems.length === 0 ?
                        <div className="px-4 py-3 flex items-center gap-3 w-full text-gray-600">
                            Ainda não há checklists criados.
                        </div>
                        :
                        checklistItems.map(item => (
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
                                    onClick={() => removeChecklistItem(item.id)}
                                    className="px-3 py-2 rounded-xl text-sm bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                                >
                                    X
                                </button>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}