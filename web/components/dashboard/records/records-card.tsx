'use client';

import Link from "next/link";

export default function RecordCard({ title, countLabel, viewHref, newHref }: { title: string, countLabel: string; viewHref: string; newHref: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <div className="flex items-start justify-between gap-3">
            <div>
            <p className="text-lg font-semibold text-neutral-900">{title}</p>
            </div>

            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                {countLabel} ativos
            </span>
        </div>

        <div className="mt-5 flex gap-3">
            <Link href={newHref} className="px-4 py-2 bg-background text-white font-semibold rounded-xl">
                Adicionar novo
            </Link>

            <Link href={viewHref} className="px-4 py-2 bg-white text-neutral-900 font-semibold rounded-xl border">
                Vizualizar
            </Link>
        </div>
    </div>
  );
}
