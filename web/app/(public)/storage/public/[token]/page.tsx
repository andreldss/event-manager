"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Archive, Loader2 } from "lucide-react";
import StorageBreadcrumb from "@/components/dashboard/storage/storage-breadcrumb";
import StorageFolderItem from "@/components/dashboard/storage/storage-folder-item";
import StorageFileCard from "@/components/dashboard/storage/storage-file-card";
import StorageLightbox from "@/components/dashboard/storage/storage-lightbox";
import type { BreadcrumbItem, StorageNode } from "@/types/storage";
import { isImage } from "@/components/dashboard/storage/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type PublicShareResponse = {
  share: {
    id: number;
    allowDownload: boolean;
    expiresAt: string | null;
  };
  folder: {
    id: number;
    name: string;
  };
};

type PublicItemsResponse = {
  rootFolder: {
    id: number;
    name: string;
  };
  currentFolderId: number;
  allowDownload: boolean;
  items: StorageNode[];
};

function formatDate(date?: string | null) {
  if (!date) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function PublicStoragePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = String(params.token);
  const currentFolderIdParam = searchParams.get("folderId");
  const currentFolderId = currentFolderIdParam
    ? Number(currentFolderIdParam)
    : null;

  const [shareData, setShareData] = useState<PublicShareResponse | null>(null);
  const [itemsData, setItemsData] = useState<PublicItemsResponse | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const canDownload = shareData?.share.allowDownload ?? false;

  const sortedItems = useMemo(() => {
    if (!itemsData?.items) return [];

    return [...itemsData.items].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }

      return a.name.localeCompare(b.name, "pt-BR", {
        sensitivity: "base",
      });
    });
  }, [itemsData]);

  const folders = sortedItems.filter((item) => item.type === "folder");
  const files = sortedItems.filter((item) => item.type === "file");
  const imageFiles = files.filter((file) => isImage(file.mimeType));
  const currentLightboxFile =
    lightboxIndex !== null ? imageFiles[lightboxIndex] : null;
  const hasPrev = lightboxIndex !== null && lightboxIndex > 0;
  const hasNext =
    lightboxIndex !== null && lightboxIndex < imageFiles.length - 1;

  function buildRoute(folderId?: number | null) {
    if (!folderId) {
      return `/storage/public/${token}`;
    }

    return `/storage/public/${token}?folderId=${folderId}`;
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [shareRes, itemsRes, breadcrumbRes] = await Promise.all([
        fetch(`${API_BASE}/storage/public/${token}`),
        fetch(
          currentFolderId
            ? `${API_BASE}/storage/public/${token}/items?parentId=${currentFolderId}`
            : `${API_BASE}/storage/public/${token}/items`,
        ),
        fetch(
          currentFolderId
            ? `${API_BASE}/storage/public/${token}/breadcrumb?folderId=${currentFolderId}`
            : `${API_BASE}/storage/public/${token}/breadcrumb`,
        ),
      ]);

      if (!shareRes.ok) {
        throw new Error("Link inválido, expirado ou revogado.");
      }

      if (!itemsRes.ok) {
        throw new Error("Não foi possível carregar os itens.");
      }

      if (!breadcrumbRes.ok) {
        throw new Error("Não foi possível carregar o caminho da pasta.");
      }

      const shareJson = (await shareRes.json()) as PublicShareResponse;
      const itemsJson = (await itemsRes.json()) as PublicItemsResponse;
      const breadcrumbJson = (await breadcrumbRes.json()) as BreadcrumbItem[];

      setShareData(shareJson);
      setItemsData(itemsJson);
      setBreadcrumb(Array.isArray(breadcrumbJson) ? breadcrumbJson : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar pasta pública.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token, currentFolderIdParam]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    function handleKeys(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev === null || prev >= imageFiles.length - 1 ? prev : prev + 1,
        );
      }

      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev === null || prev <= 0 ? prev : prev - 1,
        );
      }

      if (e.key === "Escape") {
        setLightboxIndex(null);
      }
    }

    document.addEventListener("keydown", handleKeys);
    return () => document.removeEventListener("keydown", handleKeys);
  }, [lightboxIndex, imageFiles.length]);

  function handleOpenFolder(folderId: number) {
    router.push(buildRoute(folderId));
  }

  function handleGoRoot() {
    router.push(buildRoute(null));
  }

  function handleGoBack() {
    if (breadcrumb.length > 1) {
      const previous = breadcrumb[breadcrumb.length - 2];
      router.push(buildRoute(previous.id));
      return;
    }

    handleGoRoot();
  }

  function handleDownloadFile(fileId: number) {
    window.open(
      `${API_BASE}/storage/public/${token}/files/${fileId}/download`,
      "_blank",
    );
  }

  function handleDownloadZip() {
    setDownloadingZip(true);
    window.open(`${API_BASE}/storage/public/${token}/download-zip`, "_blank");

    setTimeout(() => {
      setDownloadingZip(false);
    }, 1000);
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                Carregando...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : shareData ? (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Pasta compartilhada
                  </p>

                  <h1 className="mt-1 truncate text-2xl font-semibold text-gray-900">
                    {shareData.folder.name}
                  </h1>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      {canDownload
                        ? "Download permitido"
                        : "Somente visualização"}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1">
                      {shareData.share.expiresAt
                        ? `Expira em ${formatDate(shareData.share.expiresAt)}`
                        : "Nunca expira"}
                    </span>
                  </div>
                </div>

                {canDownload && (
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={downloadingZip}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-background px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloadingZip ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Archive size={16} />
                    )}
                    Baixar ZIP
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {!loading && !error && (
            <>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <StorageBreadcrumb
                  currentFolderId={currentFolderId}
                  breadcrumb={breadcrumb}
                  rootLabel="Anexos"
                  onGoBackFolder={handleGoBack}
                  onGoRoot={handleGoRoot}
                  onOpenFolder={handleOpenFolder}
                />
              </div>

              <div className="flex-1 rounded-2xl border border-gray-200 bg-white shadow-sm">
                {sortedItems.length === 0 ? (
                  <div className="flex h-[320px] items-center justify-center px-6 text-sm text-gray-500">
                    Esta pasta está vazia.
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 p-6">
                    {folders.length > 0 && (
                      <section>
                        {files.length > 0 && (
                          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Pastas
                          </h3>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {folders.map((folder) => (
                            <div key={folder.id} className="group">
                              <StorageFolderItem
                                folder={folder}
                                menuOpen={false}
                                onMenuToggle={() => {}}
                                onRename={() => {}}
                                onDelete={() => {}}
                                onShare={() => {}}
                                onOpen={() => handleOpenFolder(folder.id)}
                              />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {files.length > 0 && (
                      <section>
                        {folders.length > 0 && (
                          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Arquivos
                          </h3>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {files.map((file) => {
                            const imageIndex = imageFiles.findIndex(
                              (image) => image.id === file.id,
                            );

                            return (
                              <StorageFileCard
                                key={file.id}
                                node={file}
                                selected={false}
                                menuOpen={false}
                                onToggleSelect={() => {}}
                                onMenuToggle={() => {}}
                                onRename={() => {}}
                                onDelete={() => {}}
                                onDownload={() => handleDownloadFile(file.id)}
                                onPreview={() => {
                                  if (imageIndex >= 0) {
                                    setLightboxIndex(imageIndex);
                                  }
                                }}
                              />
                            );
                          })}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <StorageLightbox
        file={currentLightboxFile}
        imageUrl={
          currentLightboxFile
            ? `${API_BASE}/storage/public/${token}/files/${currentLightboxFile.id}/raw`
            : undefined
        }
        canDownload={canDownload}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onClose={() => setLightboxIndex(null)}
        onPrev={() =>
          setLightboxIndex((prev) =>
            prev === null ? prev : Math.max(prev - 1, 0),
          )
        }
        onNext={() =>
          setLightboxIndex((prev) =>
            prev === null ? prev : Math.min(prev + 1, imageFiles.length - 1),
          )
        }
        onDownload={() => {
          if (currentLightboxFile) {
            handleDownloadFile(currentLightboxFile.id);
          }
        }}
      />
    </>
  );
}
