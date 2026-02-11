'use client';
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewClient() {

    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientNotes, setClientNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('')
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setLoading(true);
        setError('');

        try {
            const response = await apiFetch('/clients', 'POST', { name: clientName, phone: clientPhone, notes: clientNotes });
            router.push('/dashboard/records/clients');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Falha ao cadastrar cliente. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center min-h-[80vh] gap-10">
            <h1 className="font-bold text-2xl text-background">Criar Cliente</h1>

            <div className="flex gap-10">
                <div className="flex flex-col gap-4 w-[500px]">

                    <div>
                        <span className='text-sm text-gray-600'>Nome do Cliente*</span>
                        <input
                            type='text'
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            required
                            className='mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400'
                            placeholder="Ex: Colégio Dehon"
                        />
                    </div>

                    <div>
                        <span className='text-sm text-gray-600'>Telefone</span>
                        <input
                            type='tel'
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className='mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400'
                            placeholder="Ex: (48) 9 9999-0000"
                        />
                    </div>

                    <div>
                        <span className='text-sm text-gray-600'>Observações</span>
                        <textarea
                            value={clientNotes}
                            onChange={(e) => setClientNotes(e.target.value)}
                            className="mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400 resize-none"
                            rows={5}
                        />
                    </div>

                </div>
            </div>
            <button type='submit' className='py-2 px-4 bg-background hover:opacity-80 active:opacity-100 text-white font-semibold rounded-lg shadow cursor-pointer mb-2'>
                {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
        </form>
    );
}
