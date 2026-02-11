'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ChevronRight } from "lucide-react";

type Event = {
    id: string | number;
    name: string;
    date?: string | null;
    location?: string | null;
    createdAt?: string;
};

export default function EventsPage() {

    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    async function loadEvents() {
        setError('');
        setIsLoading(true);

        try {
            const response = await apiFetch('/events', 'GET');
            setEvents(Array.isArray(response) ? response : []);
        } catch (err: any) {
            setError('Falha de rede ou servidor fora do ar.');
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadEvents();
    }, []);

    const filteredEvents = events.filter((e) =>
        (e.name || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 h-full min-h-0">

            <div className="flex items-end justify-between gap-4 shrink-0">
                <div className="flex gap-3">
                    <Link
                        href="/dashboard/events/create"
                        className="py-2 px-4 bg-background hover:opacity-80 active:opacity-100 text-white font-semibold rounded-lg shadow cursor-pointer"
                    >
                        + Criar evento
                    </Link>

                    <button
                        onClick={loadEvents}
                        className="py-2 px-4 bg-white hover:bg-gray-50 border font-semibold rounded-lg shadow-sm cursor-pointer"
                    >
                        Recarregar
                    </button>
                </div>

                <div>
                    <span className="text-sm text-background">Buscar</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400"
                        placeholder="Digite o nome do evento..."
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
                        <p className="font-semibold">
                            {isLoading ? "Carregando..." : `${filteredEvents.length} evento(s)`}
                        </p>
                        <p className="text-sm text-background">Seus eventos</p>
                    </div>

                    <div className="flex-1 min-h-0 overflow-auto rounded-xl">
                        {isLoading ? (
                            <div className="p-6 text-background">Buscando eventos...</div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="p-6 text-background">
                                Nenhum evento encontrado.
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredEvents.map((e, index) => (
                                    <Link
                                        key={String(e.id)}
                                        href={`/dashboard/events/${e.id}`}
                                        className={`block transition ${index % 2 === 0 ? "bg-gray-300 hover:bg-gray-400" : "bg-white hover:bg-gray-400"}`}
                                    >
                                        <div className="px-4 py-4 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <div className="flex gap-2">
                                                    <p className="font-semibold text-[16px] text-background">
                                                        {e.name}
                                                    </p>
                                                </div>

                                                <p className="text-sm text-background">
                                                    {e.location ? `Local: ${e.location}` : "Sem local"}
                                                    {e.date ? ` | Data: ${new Date(e.date).toLocaleDateString('pt-BR')}` : ""}
                                                </p>
                                            </div>

                                            <ChevronRight />
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
