"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ClientDetails() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  const [original, setOriginal] = useState({
    name: "",
    phone: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const hasChanges = useMemo(() => {
    return (
      clientName !== original.name ||
      clientPhone !== original.phone ||
      clientNotes !== original.notes
    );
  }, [clientName, clientPhone, clientNotes, original]);

  async function loadClient() {
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch(`/clients/${id}`, "GET");

      const name = response.name || "";
      const phone = response.phone || "";
      const notes = response.notes || "";

      setClientName(name);
      setClientPhone(phone);
      setClientNotes(notes);

      setOriginal({ name, phone, notes });
    } catch {
      setError("Falha ao carregar cliente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClient();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSaving(true);

    try {
      await apiFetch(`/clients/${id}`, "PATCH", {
        name: clientName,
        phone: clientPhone,
        notes: clientNotes,
      });

      router.push("/dashboard/records/clients");
    } catch {
      setError("Falha ao salvar alterações. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir este cliente?",
    );
    if (!confirmDelete) return;

    setError("");
    setDeleting(true);

    try {
      await apiFetch(`/clients/${id}`, "DELETE");
      router.push("/dashboard/records/clients");
    } catch {
      setError("Falha ao excluir cliente. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center px-6 py-6">
        <div className="flex min-h-[320px] w-full max-w-3xl items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
            <p className="text-sm text-slate-500">Carregando cliente...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 justify-center px-6 py-6">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Cadastros
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Detalhes do cliente
          </h2>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-4 md:col-span-1">
              <div>
                <label className="text-sm text-slate-600">
                  Nome do cliente*
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600">Telefone</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 md:col-span-1">
              <div>
                <label className="text-sm text-slate-600">Observações</label>
                <textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  rows={6}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/records/clients")}
              disabled={saving || deleting}
              className="cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving || deleting || !hasChanges}
              className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || deleting}
              className="cursor-pointer rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
