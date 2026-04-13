"use client";

import { apiFetch } from "@/lib/api";
import { Copy, Link2, Loader2, ShieldX, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PublicShareItem = {
  id: number;
  nodeId: number;
  token: string;
  allowDownload: boolean;
  allowUpload: boolean;
  allowCreateFolders: boolean;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  nodeId: number | null;
  folderName?: string;
};

export default function SharePublicLinkModal({
  open,
  onClose,
  nodeId,
  folderName,
}: Props) {
  const [neverExpire, setNeverExpire] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowUpload, setAllowUpload] = useState(false);
  const [allowCreateFolders, setAllowCreateFolders] = useState(false);
  const [links, setLinks] = useState<PublicShareItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const publicBaseUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  function resetState() {
    setNeverExpire(false);
    setAllowDownload(true);
    setAllowUpload(false);
    setAllowCreateFolders(false);
    setLinks([]);
    setLoading(false);
    setCreating(false);
    setError("");
    setCopyFeedback("");
    setRevokingId(null);
  }

  function buildPublicLink(token: string) {
    return `${publicBaseUrl}/storage/public/${token}`;
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Nunca expira";

    const date = new Date(dateString);

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  }

  function isExpired(item: PublicShareItem) {
    if (!item.expiresAt) return false;
    return new Date(item.expiresAt).getTime() < Date.now();
  }

  function getStatus(item: PublicShareItem) {
    if (item.revokedAt) {
      return {
        label: "Revogado",
        className: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
      };
    }

    if (isExpired(item)) {
      return {
        label: "Expirado",
        className:
          "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
      };
    }

    return {
      label: "Ativo",
      className:
        "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    };
  }

  function getExpiresAtValue() {
    if (neverExpire) return null;

    const date = new Date();
    date.setHours(date.getHours() + 24);
    return date.toISOString();
  }

  async function loadLinks() {
    if (!nodeId) return;

    setLoading(true);
    setError("");

    try {
      const data = await apiFetch(
        `/storage/nodes/${nodeId}/public-shares`,
        "GET",
      );
      setLinks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar links.");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, message = "Copiado!") {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(message);
      setTimeout(() => setCopyFeedback(""), 2000);
    } catch {
      setCopyFeedback("Não foi possível copiar.");
      setTimeout(() => setCopyFeedback(""), 2000);
    }
  }

  async function createLink() {
    if (!nodeId) return;

    setCreating(true);
    setError("");

    try {
      const body = {
        nodeId,
        allowDownload,
        allowUpload,
        allowCreateFolders,
        expiresAt: getExpiresAtValue(),
      };

      const created = await apiFetch("/storage/public-share", "POST", body);

      await loadLinks();

      if (created?.token) {
        await copyToClipboard(
          buildPublicLink(created.token),
          "Link gerado e copiado.",
        );
      } else {
        setCopyFeedback("Link gerado com sucesso.");
        setTimeout(() => setCopyFeedback(""), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar link.");
    } finally {
      setCreating(false);
    }
  }

  async function revokeLink(shareId: number) {
    setRevokingId(shareId);
    setError("");

    try {
      await apiFetch(`/storage/public-share/${shareId}/revoke`, "PATCH");

      await loadLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao revogar link.");
    } finally {
      setRevokingId(null);
    }
  }

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    loadLinks();
  }, [open, nodeId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4">
      <div className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-zinc-200 px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-zinc-900">
              Compartilhar pasta
            </h2>
            <p className="mt-1 truncate text-sm text-zinc-500">
              {folderName
                ? folderName
                : "Gerencie os links públicos desta pasta."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-6 py-6">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-zinc-800">
                  O link irá expirar em 24 horas.
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Quem acessar poderá navegar pelas subpastas e baixar os
                  arquivos.
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={neverExpire}
                  onChange={(e) => setNeverExpire(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    Nunca expirar
                  </p>
                  <p className="text-xs text-zinc-500">
                    Se marcado, o link continuará funcionando até ser revogado.
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={allowDownload}
                  onChange={(e) => setAllowDownload(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    Permitir download
                  </p>
                  <p className="text-xs text-zinc-500">
                    Quem acessar poderá baixar arquivos e a pasta em ZIP.
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={allowUpload}
                  onChange={(e) => setAllowUpload(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    Permitir envio de arquivos
                  </p>
                  <p className="text-xs text-zinc-500">
                    Quem acessar poderá adicionar novos arquivos na pasta compartilhada.
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={allowCreateFolders}
                  onChange={(e) => setAllowCreateFolders(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    Permitir criar pastas
                  </p>
                  <p className="text-xs text-zinc-500">
                    Quem acessar poderá organizar o conteúdo em novas subpastas.
                  </p>
                </div>
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={createLink}
                  disabled={creating}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Link2 size={16} />
                  )}
                  Gerar link
                </button>

                {copyFeedback ? (
                  <span className="text-sm font-medium text-emerald-600">
                    {copyFeedback}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex min-h-0 flex-1 flex-col rounded-2xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-zinc-900">
                Links criados
              </h3>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Carregando...
                </div>
              ) : links.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <p className="text-sm text-zinc-500">
                    Nenhum link criado ainda.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...links]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((item) => {
                      const status = getStatus(item);
                      const fullLink = buildPublicLink(item.token);

                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4"
                        >
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                            >
                              {status.label}
                            </span>
                            {item.allowDownload && (
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                Download
                              </span>
                            )}
                            {item.allowUpload && (
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                Upload
                              </span>
                            )}
                            {item.allowCreateFolders && (
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                Criar pastas
                              </span>
                            )}
                          </div>

                          <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                            <p className="truncate text-sm text-zinc-700">
                              {fullLink}
                            </p>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-xs text-zinc-500">
                              Expira em: {formatDate(item.expiresAt)}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(fullLink)}
                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                              >
                                <Copy size={15} />
                                Copiar
                              </button>

                              <button
                                type="button"
                                onClick={() => revokeLink(item.id)}
                                disabled={
                                  !!item.revokedAt || revokingId === item.id
                                }
                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {revokingId === item.id ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <ShieldX size={15} />
                                )}
                                Revogar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
