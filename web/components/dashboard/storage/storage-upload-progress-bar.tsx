"use client";

import { Upload } from "lucide-react";
import type { UploadState } from "@/types/storage";

export default function StorageUploadProgressBar({
  state,
}: {
  state: UploadState;
}) {
  if (state.status === "idle") return null;

  return (
    <>
      <style>{`
        @keyframes attachSlide {
          0%   { transform: translateX(-200%); }
          100% { transform: translateX(500%); }
        }
      `}</style>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
          <Upload size={15} className="text-slate-600" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {state.status === "uploading" && (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-700">
                  Enviando {state.total}{" "}
                  {state.total === 1 ? "arquivo" : "arquivos"}...
                </span>

                <span className="max-w-[160px] shrink-0 truncate text-xs text-slate-400">
                  {state.fileName}
                </span>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full w-1/3 rounded-full bg-slate-800"
                  style={{ animation: "attachSlide 1.4s ease-in-out infinite" }}
                />
              </div>
            </>
          )}

          {state.status === "done" && (
            <span className="text-xs font-medium text-emerald-700">
              {state.total}{" "}
              {state.total === 1 ? "arquivo enviado" : "arquivos enviados"} com
              sucesso
            </span>
          )}

          {state.status === "error" && (
            <span className="text-xs font-medium text-rose-600">
              {state.message}
            </span>
          )}
        </div>

        {(state.status === "done" || state.status === "error") && (
          <div
            className={`h-2 w-2 shrink-0 rounded-full ${
              state.status === "done" ? "bg-emerald-400" : "bg-rose-400"
            }`}
          />
        )}
      </div>
    </>
  );
}
