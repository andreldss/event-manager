'use client';

import RecordCard from "@/components/dashboard/records/records-card";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

export default function RecordsDashboard() {

    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [countClients, setCountClients] = useState('')

    async function loadClients() {
        setError('');
        setIsLoading(true);

        try {
            const response = await apiFetch('/clients/count', 'GET');
            setCountClients(response);
        } catch (error) {
            setError('Falha de rede ou servidor fora do ar.');
            setCountClients('-');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadClients();
    }, []);

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Cadastros Básicos</h1>
            </div>

            {error && (
                <div className="border border-red-300 bg-red-50 text-red-700 px-4 py-2 rounded-lg mb-4">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <RecordCard
                    title="Clientes"
                    countLabel={countClients}
                    viewHref="/dashboard/records/clients"
                    newHref="/dashboard/records/clients/new"
                />

            </div>
        </div>
    );
}
