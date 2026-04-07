import type { ReactNode } from "react";

type SummaryCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
};

export default function SummaryCard({ title, value, icon }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="mt-1 text-sm font-medium text-slate-500">{title}</h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600">
          {icon}
        </div>
      </div>

      <p className="mt-6 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
