'use client';

import RecordCard from "@/components/dashboard/records/records-card";

export default function RecordsDashboard() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="mb-8">
            <h1 className="text-2xl font-bold">Cadastros Básicos</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <RecordCard
                title="Clientes"
                countLabel="10"
                viewHref="/dashboard/records/clients"
                newHref="/dashboard/records/clients/new"
            />

            <RecordCard
                title="Fornecedores"
                countLabel="18"
                viewHref="/dashboard/records/suppliers"
                newHref="/dashboard/records/suppliers/new"
            />

            <RecordCard
                title="Produtos"
                countLabel="9"
                viewHref="/dashboard/records/products"
                newHref="/dashboard/records/products/new"
            />


        </div>
    </div>
  );
}
