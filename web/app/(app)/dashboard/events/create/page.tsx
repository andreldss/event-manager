'use client';
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CreateEvent() {

    const [eventName, setEventName] = useState('');
    const [eventType, setEventType] = useState<'collective' | 'simple'>('simple');
    const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
    const [clientId, setClientId] = useState<number | null>(null);
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [eventDate, setEventDate] = useState('')
    const [eventLocation, setEventLocation] = useState('')
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [eventNotes, setEventNotes] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter();

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setSaving(true);
        setError('');

        try {
            const response = await apiFetch('/events/create', 'POST', { name: eventName, type: eventType, date: eventDate, location: eventLocation, notes: eventNotes, clientId: clientId });
            router.push('/dashboard/events');
        } catch (err) {
            setError('Falha ao cadastrar evento. Tente novamente.');
        } finally {
            setSaving(false);
        }
    }

    async function loadClients() {
        setError('');
        setIsLoading(true)

        try {
            const response = await apiFetch('/clients', 'GET');
            setClients(Array.isArray(response) ? response : []);
        } catch (error) {
            setError('Falha de rede ou servidor fora do ar.');
            setClients([]);
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadClients();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] gap-10">
                <h1 className="font-bold text-2xl text-background">Criar Evento</h1>
                <p className="text-gray-600">Carregando...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center min-h-[80vh] gap-10">
            <h1 className="font-bold text-2xl text-background">Criar Evento</h1>
            <div className="flex gap-10">
                <div className="flex flex-col gap-4">
                    <div>
                        <span className='text-sm text-background'>Nome do Evento*</span>
                        <input
                            type='text'
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            required
                            className='mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400'
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className='text-sm text-background'>Tipo do Evento*</span>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setEventType('collective')} className={`mt-1 px-4 py-2 rounded-lg border transition cursor-pointer
                                ${eventType === 'collective' ? 'bg-background text-white' : 'bg-white px-4 py-2 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400'}`}>
                                Coletivo
                            </button>

                            <button type="button" onClick={() => setEventType('simple')} className={`mt-1 px-4 py-2 rounded-lg border transition cursor-pointer
                                ${eventType === 'simple' ? 'bg-background text-white' : 'bg-white px-4 py-2 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400'}`}>
                                Simples
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <span className="text-sm text-background">Cliente*</span>
                        <input
                            type="text"
                            value={
                                open ? query : clients.find(c => c.id === clientId)?.name || ''
                            }
                            onFocus={() => setOpen(true)}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setOpen(true);
                            }}
                            placeholder="Selecione um cliente..."
                            className="mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50"
                        />


                        {open && (
                            <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border rounded-lg shadow">
                                {filteredClients.length === 0 && (
                                    <div className="px-4 py-2 text-sm text-gray-500">
                                        Selecione um cliente válido.
                                    </div>
                                )}


                                {filteredClients.map((c) => (
                                    <div
                                        key={c.id}
                                        onClick={() => {
                                            setClientId(c.id);
                                            setQuery('');
                                            setOpen(false);
                                        }}
                                        className="px-4 py-2 cursor-pointer hover:bg-gray-100">
                                        {c.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <span className='text-sm text-background'>Observações</span>
                        <textarea
                            className="mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400 resize-none"
                            value={eventNotes}
                            onChange={(e) => setEventNotes(e.target.value)}
                            rows={5}
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <div>
                        <span className='text-sm text-background'>Data</span>
                        <input
                            type='date'
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            required
                            className='mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400'
                        />
                    </div>
                    <div>
                        <span className='text-sm text-background'>Local</span>
                        <input
                            type='text'
                            value={eventLocation}
                            onChange={(e) => setEventLocation(e.target.value)}
                            required
                            className='mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400'
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="w-[500px] border border-red-300 bg-red-50 text-red-700 px-4 py-2 rounded-lg">
                    {error}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    type='submit'
                    disabled={saving}
                    className='py-2 px-4 bg-background hover:opacity-80 active:opacity-100 text-white font-semibold rounded-lg shadow cursor-pointer mb-2 disabled:opacity-60 disabled:cursor-not-allowed'
                >
                    {saving ? 'Criando...' : 'Criar'}
                </button>

                <button
                    type='button'
                    onClick={() => router.push('/dashboard/events')}
                    disabled={saving}
                    className="py-2 px-4 bg-white hover:bg-gray-50 border font-semibold rounded-lg shadow-sm cursor-pointer mb-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    Cancelar
                </button>
            </div>
        </form>
    )
}