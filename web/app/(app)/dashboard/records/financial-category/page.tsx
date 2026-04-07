"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ChevronRight, RotateCcw, Search, Plus } from "lucide-react";

type Category = {
  id: string | number;
  name: string;
};

export default function FinancialCategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setError("");
    setIsLoading(true);

    try {
      const response = await apiFetch("/financial-category", "GET");
      setCategories(Array.isArray(response) ? response : []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Falha ao carregar as categorias financeiras.");
      }
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;

    return categories.filter((c) => c.name.toLowerCase().includes(term));
  }, [categories, search]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Cadastros
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Categorias financeiras
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative sm:w-[260px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar categoria..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <button
              onClick={load}
              className="cursor-pointer rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
            >
              <RotateCcw size={14} />
            </button>

            <Link
              href="/dashboard/records/financial-category/new"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              <Plus size={14} />
              Nova categoria
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-500">Carregando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            Nenhuma categoria encontrada.
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((c) => (
              <Link
                key={String(c.id)}
                href={`/dashboard/records/financial-category/${c.id}`}
                className="group flex items-center justify-between px-4 py-4 hover:bg-slate-50"
              >
                <div className="flex gap-2">
                  <span className="text-slate-400 text-sm">#{c.id}</span>
                  <span className="font-semibold text-slate-900">{c.name}</span>
                </div>

                <ChevronRight className="text-slate-300 group-hover:text-slate-500" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
