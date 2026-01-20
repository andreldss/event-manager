'use client';
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ClientDetails() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;

    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientNotes, setClientNotes] = useState('');

    const [original, setOriginal] = useState({
        name: '',
        phone: '',
        notes: '',
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    const hasChanges =
        clientName !== original.name ||
        clientPhone !== original.phone ||
        clientNotes !== original.notes;

    async function loadClient() {
        setError('');
        setLoading(true);

        try {
            const response = await apiFetch(`/clients/${id}`, 'GET');

            const name = response.name || '';
            const phone = response.phone || '';
            const notes = response.notes || '';

            setClientName(name);
            setClientPhone(phone);
            setClientNotes(notes);

            setOriginal({ name, phone, notes });
        } catch (err) {
            setError('Falha ao carregar cliente.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadClient();
    }, []);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();

        setError('');
        setSaving(true);

        try {
            await apiFetch(`/clients/${id}`, 'PATCH', {
                name: clientName,
                phone: clientPhone,
                notes: clientNotes,
            });

            router.push('/dashboard/records/clients');
        } catch (err) {
            setError('Falha ao salvar alterações. Tente novamente.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        const confirmDelete = window.confirm('Tem certeza que deseja excluir este cliente?');
        if (!confirmDelete) return;

        setError('');
        setDeleting(true);

        try {
            await apiFetch(`/clients/${id}`, 'DELETE');
            router.push('/dashboard/records/clients');
        } catch (err) {
            setError('Falha ao excluir cliente. Tente novamente.');
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center min-h-[80vh] gap-10">
                <h1 className="font-bold text-2xl text-background">Cliente</h1>
                <p className="text-gray-600">Carregando...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSave} className="flex flex-col items-center justify-center min-h-[80vh] gap-10">
            <h1 className="font-bold text-2xl text-background">Detalhes do Cliente</h1>

            {error && (
                <div className="w-[500px] border border-red-300 bg-red-50 text-red-700 px-4 py-2 rounded-lg">
                    {error}
                </div>
            )}

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
                        />
                    </div>

                    <div>
                        <span className='text-sm text-gray-600'>Telefone</span>
                        <input
                            type='tel'
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className='mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400'
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

                    <div className="flex justify-center gap-3">
                        <button
                            type='submit'
                            disabled={saving || deleting || !hasChanges}
                            className='py-2 px-4 bg-background hover:opacity-80 active:opacity-100 text-white font-semibold rounded-lg shadow cursor-pointer mb-2 disabled:opacity-60 disabled:cursor-not-allowed'
                        >
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>

                        <button
                            type='button'
                            onClick={() => router.push('/dashboard/records/clients')}
                            disabled={saving || deleting}
                            className="py-2 px-4 bg-white hover:bg-gray-50 border font-semibold rounded-lg shadow-sm cursor-pointer mb-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Cancelar
                        </button>

                        <button
                            type='button'
                            onClick={handleDelete}
                            disabled={saving || deleting}
                            className='py-2 px-4 bg-red-800 hover:opacity-90 active:opacity-100 text-white font-semibold rounded-lg shadow cursor-pointer mb-2 disabled:opacity-60 disabled:cursor-not-allowed'
                        >
                            {deleting ? 'Excluindo...' : 'Excluir'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
