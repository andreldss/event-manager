"use client";

import Link from "next/link";

type Props = {
  title: string;
  countLabel: string;
  viewHref: string;
  newHref: string;
};

export default function RecordCard({
  title,
  countLabel,
  viewHref,
  newHref,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-900">{title}</p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {countLabel} ativos
        </span>
      </div>

      <div className="mt-5 flex gap-3">
        <Link
          href={newHref}
          className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Adicionar novo
        </Link>

        <Link
          href={viewHref}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          Visualizar
        </Link>
      </div>
    </div>
  );
}
