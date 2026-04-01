"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function FinancialCategoryDetails() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [categoryName, setCategoryName] = useState("");

  const [original, setOriginal] = useState({ name: "" });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const hasChanges = useMemo(() => {
    return categoryName !== original.name;
  }, [categoryName, original]);

  async function loadCategory() {
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch(`/financial-category/${id}`, "GET");

      const name = response.name || "";

      setCategoryName(name);
      setOriginal({ name });
    } catch {
      setError("Falha ao carregar categoria.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategory();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      await apiFetch(`/financial-category/${id}`, "PATCH", {
        name: categoryName,
      });

      router.push("/dashboard/records/financial-category");
    } catch {
      setError("Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Excluir esta categoria?")) return;

    setDeleting(true);
    setError("");

    try {
      await apiFetch(`/financial-category/${id}`, "DELETE");
      router.push("/dashboard/records/financial-category");
    } catch {
      setError("Falha ao excluir.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full justify-center px-6 py-6">
        <div className="flex min-h-[320px] w-full max-w-xl items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
            <p className="text-sm text-slate-500">Carregando categoria...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 justify-center px-6 py-6">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Cadastros
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Detalhes da categoria
          </h2>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div>
            <label className="text-sm text-slate-600">Nome da categoria*</label>
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() =>
                router.push("/dashboard/records/financial-category")
              }
              className="cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!hasChanges || saving || deleting}
              className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || deleting}
              className="cursor-pointer rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
