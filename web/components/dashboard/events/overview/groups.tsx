import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

type GroupItem = {
    id: string;
    text: string;
};

type EventChartProps = {
    eventId: number;
};

export default function OverviewGroups({ eventId }: EventChartProps) {
    const [groupItems, setGroupItems] = useState<GroupItem[]>([]);
    const [newGroupText, setNewGroupText] = useState('');
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false);

    async function addGroupItem() {
        if (loading) return;

        setError('');
        setLoading(true);

        const text = newGroupText.trim();
        if (!text) {
            setError('Texto do grupo não pode ser vazio.');
            setLoading(false);
            return;
        }

        try {
            await apiFetch(`/events/${eventId}/group`, 'POST', { text });
            setNewGroupText('');
            loadGroups();
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('Falha ao criar grupo.');
        } finally {
            setLoading(false);
        }
    }

    async function loadGroups() {
        setError('');
        setLoading(true);

        try {
            const response = await apiFetch(`/events/${eventId}/group`, 'GET');
            setGroupItems(Array.isArray(response) ? response : []);
            console.log(groupItems)
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('Falha ao carregar grupos.');
            setGroupItems([]);
        } finally {
            setLoading(false);
        }
    }

    async function removeGroupItem(id: string) {
        if (loading) return;

        setError('');
        setLoading(true);

        try {
            await apiFetch(`/events/${eventId}/group/${id}`, 'DELETE');
            loadGroups();
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('Falha ao remover grupo.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadGroups();
    }, [eventId]);

    return (
        <div className="flex flex-col min-h-0 flex-[1] border rounded-2xl bg-white overflow-hidden">
            <div className="p-4 border-b flex items-center gap-3 justify-center">
                <input
                    value={newGroupText}
                    onChange={(e) => setNewGroupText(e.target.value)}
                    placeholder="Novo grupo. Ex: 301, 302"
                    className="px-3 py-2 rounded-xl border bg-white text-sm outline-none focus:ring-2 focus:ring-gray-200"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') addGroupItem();
                    }}
                />

                <button
                    type="button"
                    onClick={addGroupItem}
                    className="px-3 py-2 rounded-xl text-sm font-medium bg-background text-white hover:opacity-90 transition cursor-pointer active:opacity-80"
                >
                    + Grupo
                </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto px-2 text-sm text-gray-600">
                {error && (
                    <div className="border border-red-300 bg-red-50 text-red-700 px-4 py-2 rounded-lg m-4">
                        {error}
                    </div>
                )}

                {groupItems.length === 0 ?
                    <div className="px-4 py-3 flex items-center gap-3 w-full" >
                        Ainda não há registros de grupos.
                    </div>
                    : groupItems.map(item => (
                        <div key={item.id} className="px-4 py-3 flex items-center gap-3 w-full justify-between" >
                            <div className="flex items-center gap-3 min-w-0">
                                <p className={"text-sm text-background break-words"}>
                                    {item.text}
                                </p>
                            </div>

                            <button
                                onClick={() => removeGroupItem(item.id)}
                                className="px-3 py-2 rounded-xl text-sm bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                            >
                                X
                            </button>
                        </div>
                    ))}
            </div>
        </div>
    )
}