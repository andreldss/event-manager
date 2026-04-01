"use client";

import RecordCard from "@/components/dashboard/records/records-card";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

export default function RecordsDashboard() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [countClients, setCountClients] = useState("-");
  const [countFinancialCategories, setCountFinancialCategories] = useState("-");
  const [countUsers, setCountUsers] = useState("-");

  async function loadData() {
    setError("");
    setIsLoading(true);

    try {
      const [clientsResponse, categoriesResponse, usersResponse] =
        await Promise.all([
          apiFetch("/clients/count", "GET"),
          apiFetch("/financial-category/count", "GET"),
          apiFetch("/users/count", "GET"),
        ]);

      setCountClients(String(clientsResponse));
      setCountFinancialCategories(String(categoriesResponse));
      setCountUsers(String(usersResponse));
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Falha de rede ou servidor fora do ar.");
      }

      setCountClients("-");
      setCountFinancialCategories("-");
      setCountUsers("-");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Cadastros
        </p>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">
          Cadastros básicos
        </h1>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
            <p className="text-sm text-slate-500">Carregando cadastros...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <RecordCard
            title="Clientes"
            countLabel={countClients}
            viewHref="/dashboard/records/clients"
            newHref="/dashboard/records/clients/new"
          />

          <RecordCard
            title="Categorias financeiras"
            countLabel={countFinancialCategories}
            viewHref="/dashboard/records/financial-category"
            newHref="/dashboard/records/financial-category/new"
          />

          <RecordCard
            title="Usuários"
            countLabel={countUsers}
            viewHref="/dashboard/records/users"
            newHref="/dashboard/records/users/new"
          />
        </div>
      )}
    </div>
  );
}
