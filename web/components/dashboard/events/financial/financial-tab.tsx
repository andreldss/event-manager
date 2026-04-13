"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import FinancialPanel from "../../financial/financial-panel";
import CreateTransactionModal from "../../financial/create-transaction-modal";
import EditTransactionModal from "../../financial/edit-transaction-modal";
import { useAuth } from "@/hooks/use-auth";
import type {
  FinancialFilterValues,
  FinancialListResponse,
  FinancialSummary,
  Transaction,
} from "@/types/financial";

type Props = {
  eventId: number;
  onFinancialChanged: () => void;
  financialRefreshTrigger: number;
};

const initialFilters: FinancialFilterValues = {
  search: "",
  type: "",
  status: "",
  eventId: "",
  categoryId: "",
  startDate: "",
  endDate: "",
};

export default function FinancialTab({
  eventId,
  onFinancialChanged,
  financialRefreshTrigger,
}: Props) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    income: 0,
    expense: 0,
    plannedExpense: 0,
    balance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<FinancialFilterValues>(initialFilters);
  const [openModal, setOpenModal] = useState(false);
  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  function buildQuery(pageValue: number) {
    const params = new URLSearchParams({
      page: String(pageValue),
      pageSize: "30",
    });

    if (filters.search.trim()) params.set("search", filters.search.trim());
    if (filters.type) params.set("type", filters.type);
    if (filters.status) params.set("status", filters.status);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);

    return params.toString();
  }

  async function loadTransactions(pageValue = 1, append = false) {
    setError("");

    if (append) {
      setIsFetchingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = (await apiFetch(
        `/financial/event/${eventId}?${buildQuery(pageValue)}`,
        "GET",
      )) as FinancialListResponse;

      setTransactions((prev) =>
        append ? [...prev, ...response.items] : response.items,
      );
      setSummary(response.summary);
      setPage(response.pagination.page);
      setHasMore(response.pagination.hasMore);
      setTotalCount(response.pagination.total);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Falha de rede ou servidor fora do ar.");

      if (!append) {
        setTransactions([]);
        setSummary({
          income: 0,
          expense: 0,
          plannedExpense: 0,
          balance: 0,
        });
        setHasMore(false);
        setTotalCount(0);
      }
    } finally {
      if (append) {
        setIsFetchingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }

  async function markAsPaid(transactionId: number) {
    if (settlingId) return;

    setSettlingId(transactionId);
    setError("");

    try {
      await apiFetch(
        `/financial/event/${eventId}/${transactionId}/settle`,
        "PATCH",
      );
      await loadTransactions();
      onFinancialChanged();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Falha ao marcar como pago.");
    } finally {
      setSettlingId(null);
    }
  }

  async function loadMoreTransactions() {
    if (isLoading || isFetchingMore || !hasMore) return;
    await loadTransactions(page + 1, true);
  }

  async function handleDeleteTransaction(transaction: Transaction) {
    const message =
      transaction.sourceType === "collection"
        ? `Excluir a movimentação "${transaction.description}"? A coleta vinculada também será removida.`
        : `Excluir a movimentação "${transaction.description}"?`;

    if (!window.confirm(message)) return;

    try {
      await apiFetch(`/financial/event/${eventId}/${transaction.id}`, "DELETE");
      await loadTransactions();
      onFinancialChanged();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Falha ao excluir movimentação.");
    }
  }

  useEffect(() => {
    if (!eventId) return;
    loadTransactions(1, false);
  }, [eventId, financialRefreshTrigger, filters]);

  return (
    <>
      <FinancialPanel
        title="Movimentações do evento"
        subtitle="Entradas, saídas e despesas programadas deste evento."
        transactions={transactions}
        summary={summary}
        isLoading={isLoading}
        isFetchingMore={isFetchingMore}
        hasMore={hasMore}
        error={error}
        filters={filters}
        onFiltersChange={setFilters}
        onReload={loadTransactions}
        onLoadMore={loadMoreTransactions}
        onAdd={() => setOpenModal(true)}
        onMarkAsPaid={markAsPaid}
        settlingId={settlingId}
        totalCount={totalCount}
        canManageTransactions={Boolean(user?.isAdmin)}
        onEditTransaction={(transaction) => {
          setSelectedTransaction(transaction);
          setEditModalOpen(true);
        }}
        onDeleteTransaction={handleDeleteTransaction}
      />

      <CreateTransactionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={() => {
          loadTransactions();
          onFinancialChanged();
        }}
        eventId={eventId}
      />

      <EditTransactionModal
        open={editModalOpen}
        transaction={selectedTransaction}
        eventId={eventId}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedTransaction(null);
        }}
        onUpdated={() => {
          loadTransactions();
          onFinancialChanged();
        }}
      />
    </>
  );
}
