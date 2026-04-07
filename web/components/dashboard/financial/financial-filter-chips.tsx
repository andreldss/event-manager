import type { FinancialFilterValues, FinancialOption } from "@/types/financial";

type Props = {
  filters: FinancialFilterValues;
  availableEvents: FinancialOption[];
  availableCategories: FinancialOption[];
};

export default function FinancialFilterChips({
  filters,
  availableEvents,
  availableCategories,
}: Props) {
  const chips: string[] = [];

  if (filters.type === "income") chips.push("Tipo: Entradas");
  if (filters.type === "expense") chips.push("Tipo: Saídas");

  if (filters.status === "settled") chips.push("Status: Pago / Recebido");
  if (filters.status === "planned") chips.push("Status: Programado");

  if (filters.eventId) {
    const event = availableEvents.find(
      (item) => String(item.id) === filters.eventId,
    );
    if (event) chips.push(`Evento: ${event.name}`);
  }

  if (filters.categoryId) {
    const category = availableCategories.find(
      (item) => String(item.id) === filters.categoryId,
    );
    if (category) chips.push(`Categoria: ${category.name}`);
  }

  if (filters.startDate && filters.endDate) {
    chips.push(`Período: ${filters.startDate} até ${filters.endDate}`);
  } else if (filters.startDate) {
    chips.push(`A partir de: ${filters.startDate}`);
  } else if (filters.endDate) {
    chips.push(`Até: ${filters.endDate}`);
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={chip}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
