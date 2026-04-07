export type Transaction = {
  id: number;
  eventId: number;
  type: "income" | "expense";
  status?: "planned" | "settled";
  amount: number | string;
  description: string;
  category?: { id: number; name: string } | null;
  event?: { id: number; name: string } | null;
  createdAt?: string;
  paidAt?: string | null;
};

export type FinancialFilterValues = {
  search: string;
  type: string;
  status: string;
  eventId: string;
  categoryId: string;
  startDate: string;
  endDate: string;
};

export type FinancialFilterVisibility = {
  search?: boolean;
  type?: boolean;
  status?: boolean;
  event?: boolean;
  category?: boolean;
  dateRange?: boolean;
};

export type FinancialOption = {
  id: number;
  name: string;
};
