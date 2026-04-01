"use client";

import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await apiFetch("/users", "POST", {
        name,
        email,
        password,
        isAdmin,
      });

      router.push("/dashboard/records/users");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Falha ao cadastrar usuário.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 justify-center px-6 py-6">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Cadastros
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Novo usuário
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
                <label className="text-sm text-slate-600">Senha*</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
              disabled={loading}
              className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
