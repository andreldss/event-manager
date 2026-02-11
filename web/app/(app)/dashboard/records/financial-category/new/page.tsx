'use client';
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewFinancialCategory() {

    const [categoryName, setCategoryName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('')
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setLoading(true);
        setError('');

        try {
            const response = await apiFetch('/financial-category', 'POST', { name: categoryName });
            router.push('/dashboard/records/financial-category');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Falha ao cadastrar categoria. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center min-h-[80vh] gap-10">
            <h1 className="font-bold text-2xl text-background">Criar Categoria de Transação</h1>

            <div className="flex gap-10">
                <div className="flex flex-col gap-4 w-[500px]">

                    <div>
                        <span className='text-sm text-gray-600'>Nome do Categoria*</span>
                        <input
                            type='text'
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            required
                            className='mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400'
                            placeholder="Ex: BANDA/DJ"
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
