"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function UserDetails() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [original, setOriginal] = useState({
    name: "",
    email: "",
    isAdmin: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const hasChanges = useMemo(() => {
    return (
      name !== original.name ||
      email !== original.email ||
      isAdmin !== original.isAdmin ||
      password.trim() !== ""
    );
  }, [name, email, isAdmin, password, original]);

  async function loadUser() {
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch(`/users/${id}`, "GET");

      const loadedName = response.name || "";
      const loadedEmail = response.email || "";
      const loadedIsAdmin = !!response.isAdmin;

      setName(loadedName);
      setEmail(loadedEmail);
      setIsAdmin(loadedIsAdmin);

      setOriginal({
        name: loadedName,
        email: loadedEmail,
        isAdmin: loadedIsAdmin,
      });
    } catch {
      setError("Falha ao carregar usuário.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      await apiFetch(`/users/${id}`, "PATCH", {
        name,
        email,
        isAdmin,
        ...(password.trim() ? { password } : {}),
      });

      router.push("/dashboard/records/users");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Falha ao salvar usuário.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir este usuário?",
    );
    if (!confirmDelete) return;

    setDeleting(true);
    setError("");

    try {
      await apiFetch(`/users/${id}`, "DELETE");
      router.push("/dashboard/records/users");
    } catch {
      setError("Falha ao excluir usuário.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full justify-center px-6 py-6">
        <div className="flex min-h-[320px] w-full max-w-3xl items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
            <p className="text-sm text-slate-500">Carregando usuário...</p>
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
            Detalhes do usuário
          </h2>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-slate-600">Nome*</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600">E-mail*</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-slate-600">Nova senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Preencha só se quiser alterar"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Administrador
                    </p>
                    <p className="text-xs text-slate-500">
                      Permite acesso administrativo no sistema.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-slate-800"
                  />
                </label>
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
              onClick={() => router.push("/dashboard/records/users")}
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
