'use client';

import { useEffect, useState } from "react";
import CreateFolderModal from "./create-folder-modal";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function AttachmentsTab() {
    const [search, setSearch] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const params = useParams();
    const eventId = Number(params.id);

    async function loadFolders() {
        setError('');
        setIsLoading(true);

        try {
            //const response = await apiFetch(`/financial/${eventId}`, 'GET');
            //setTransactions(Array.isArray(response) ? response : []);
            null;
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('Falha ao criar movimentação.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadFolders();
    }, []);

    return (
        <div className="flex h-full min-h-0 w-full flex-col gap-3">
            <div className="flex w-full items-center justify-between gap-3">
                <div className="w-full max-w-xl">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar nesta pasta..."
                        className="w-full rounded-lg border bg-gray-50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => setOpenModal(true)}
                    className="shrink-0 rounded-lg border bg-background px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                >
                    + Novo
                </button>
            </div>

            <div className="h-px w-full bg-gray-200" />

            <div className="flex min-h-0 w-full flex-1 flex-col">
                {/* TODO: empty state / grid */}
            </div>

            <CreateFolderModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                onCreated={loadFolders}
                eventId={eventId}
            />
        </div>
    );
}