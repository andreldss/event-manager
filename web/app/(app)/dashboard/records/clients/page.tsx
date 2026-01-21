'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Client = {
    id: string | number;
    name: string;
    phone?: string | null;
    notes?: string | null;
    createdAt?: string;
};

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    async function loadClients() {
        setError('');
        setIsLoading(true);

        try {
            const response = await apiFetch('/clients', 'GET');
            setClients(Array.isArray(response) ? response : []);
        } catch (error) {
            setError('Falha de rede ou servidor fora do ar.');
            setClients([]);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadClients();
    }, []);

    const filteredClients = clients.filter((c) =>
        c.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col items-center min-h-[80vh] gap-10">
            <div className="flex items-end justify-between gap-4">
                <div className="flex gap-3">
                    <Link href="/dashboard/records/clients/new" className='py-2 px-4 bg-background hover:opacity-80 active:opacity-100 text-white font-semibold rounded-lg shadow cursor-pointer'>
                        + Novo cliente
                    </Link>

                    <button onClick={loadClients} className="py-2 px-4 bg-white hover:bg-gray-50 border font-semibold rounded-lg shadow-sm cursor-pointer">
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
                        placeholder="Digite o nome do cliente..."
                    />
                </div>
            </div>

            {error && (
                <div className="w-[900px] border border-red-300 bg-red-50 text-red-700 px-4 py-2 rounded-lg">
                    {error}
                </div>
            )}

            <div className="w-[1200px] max-h-[70vh] p-4 overflow-y-auto rounded-xl shadow-lg">
                <div className="p-4 flex flex-col gap-3">
                    <div className="px-4 py-3 border rounded-xl flex items-center justify-between">
                        <p className="font-semibold">
                            {isLoading ? "Carregando..." : `${filteredClients.length} cliente(s)`}
                        </p>
                        <p className="text-sm text-background">Cadastros recorrentes</p>
                    </div>

                    {isLoading ? (
                        <div className="p-6 text-background">Buscando clientes...</div>
                    ) : filteredClients.length === 0 ? (
                        <div className="p-6 text-background">
                            Nenhum cliente encontrado.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredClients.map((c, index) => (
                                <Link key={String(c.id)} href={`/dashboard/records/clients/${c.id}`} className={`block transition ${index % 2 === 0 ? "bg-gray-300 hover:bg-gray-400" : "bg-white hover:bg-gray-400"}`}>
                                    <div className="px-4 py-4 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <div className="flex gap-2">
                                                <p>Cód: {c.id} -</p>
                                                <p className="font-semibold text-[16px] text-background">
                                                    {c.name}
                                                </p>
                                            </div>
                                            <p className="text-sm text-background">
                                                Fone: {c.phone ? c.phone : "Sem telefone"}
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
    );
}
