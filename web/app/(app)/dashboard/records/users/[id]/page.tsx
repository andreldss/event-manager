"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type AccessLevel = "none" | "view" | "manage";

type PermissionsState = {
  financialAccess: AccessLevel;
  recordsAccess: AccessLevel;
  attachmentsAccess: AccessLevel;
  collectionsAccess: AccessLevel;
  eventsAccess: AccessLevel;
  usersAccess: AccessLevel;
};

const defaultPermissions: PermissionsState = {
  financialAccess: "none",
  recordsAccess: "none",
  attachmentsAccess: "none",
  collectionsAccess: "none",
  eventsAccess: "none",
  usersAccess: "none",
};

const permissionOptions = [
  { key: "eventsAccess", label: "Eventos" },
  { key: "financialAccess", label: "Financeiro" },
  { key: "collectionsAccess", label: "Recolhimentos" },
  { key: "attachmentsAccess", label: "Anexos" },
  { key: "recordsAccess", label: "Cadastros" },
  { key: "usersAccess", label: "Usuários" },
] as const;

export default function UserDetails() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissions, setPermissions] =
    useState<PermissionsState>(defaultPermissions);

  const [original, setOriginal] = useState({
    name: "",
    email: "",
    isAdmin: false,
    permissions: defaultPermissions,
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
      password.trim() !== "" ||
      JSON.stringify(permissions) !== JSON.stringify(original.permissions)
    );
  }, [name, email, isAdmin, password, permissions, original]);

  async function loadUser() {
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch(`/users/${id}`, "GET");

      const loadedName = response.name || "";
      const loadedEmail = response.email || "";
      const loadedIsAdmin = !!response.isAdmin;

      const loadedPermissions = {
        financialAccess: response.permissions?.financialAccess || "none",
        recordsAccess: response.permissions?.recordsAccess || "none",
        attachmentsAccess: response.permissions?.attachmentsAccess || "none",
        collectionsAccess: response.permissions?.collectionsAccess || "none",
        eventsAccess: response.permissions?.eventsAccess || "none",
        usersAccess: response.permissions?.usersAccess || "none",
      } as PermissionsState;

      setName(loadedName);
      setEmail(loadedEmail);
      setIsAdmin(loadedIsAdmin);
      setPermissions(loadedPermissions);

      setOriginal({
        name: loadedName,
        email: loadedEmail,
        isAdmin: loadedIsAdmin,
        permissions: loadedPermissions,
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

  function handlePermissionChange(
    key: keyof PermissionsState,
    value: AccessLevel,
  ) {
    setPermissions((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      await apiFetch(`/users/${id}`, "PATCH", {
        name,
        email,
        isAdmin,
        permissions,
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
        <div className="flex min-h-[320px] w-full max-w-5xl items-center justify-center rounded-2xl border border-slate-200 bg-white">
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
      <div className="w-full max-w-5xl">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Cadastros
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Detalhes do usuário
          </h2>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">

            {/* BLOCO DADOS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
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
              </div>
            </div>

            {/* BLOCO PERMISSÕES */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-900">
                  Permissões
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Controle de acesso do usuário.
                </p>
              </div>

              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Administrador
                  </span>

                  <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-slate-800"
                  />
                </label>
              </div>

              <div className="max-h-[260px] overflow-y-auto pr-1">
                <div className="flex flex-col gap-2">
                  {permissionOptions.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <span className="text-sm text-slate-700">
                        {item.label}
                      </span>

                      <select
                        value={permissions[item.key]}
                        onChange={(e) =>
                          handlePermissionChange(
                            item.key,
                            e.target.value as AccessLevel,
                          )
                        }
                        disabled={isAdmin}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                      >
                        <option value="none">Nenhum</option>
                        <option value="view">Visualizar</option>
                        <option value="manage">Gerenciar</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {isAdmin && (
                <p className="mt-3 text-xs text-slate-500">
                  Administrador possui acesso total.
                </p>
              )}
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