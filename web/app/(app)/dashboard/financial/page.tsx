"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import FinancialPanel from "@/components/dashboard/financial/financial-panel";
import CreateGlobalTransactionModal from "@/components/dashboard/financial/create-global-transaction-modal";
import GlobalFinancialFiltersModal from "@/components/dashboard/financial/global-financial-filters-modal";
import EditTransactionModal from "@/components/dashboard/financial/edit-transaction-modal";
import { useAuth } from "@/hooks/use-auth";
import type {
  FinancialFilterValues,
  FinancialListResponse,
  FinancialOption,
  FinancialSummary,
  Transaction,
} from "@/types/financial";

const initialFilters: FinancialFilterValues = {
  search: "",
  type: "",
  status: "",
  eventId: "",
  categoryId: "",
  startDate: "",
  endDate: "",
};

export default function GlobalFinancialPage() {
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
  const [draftFilters, setDraftFilters] =
    useState<FinancialFilterValues>(initialFilters);
  const [openModal, setOpenModal] = useState(false);
  const [openFiltersModal, setOpenFiltersModal] = useState(false);
  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [events, setEvents] = useState<FinancialOption[]>([]);
  const [categories, setCategories] = useState<FinancialOption[]>([]);
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
    if (filters.eventId) params.set("eventId", filters.eventId);
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
        `/financial?${buildQuery(pageValue)}`,
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

  async function loadAuxiliaryData() {
    try {
      const [eventsResponse, categoriesResponse] = await Promise.all([
        apiFetch("/events", "GET"),
        apiFetch("/financial-category", "GET"),
      ]);

      setEvents(Array.isArray(eventsResponse) ? eventsResponse : []);
      setCategories(
        Array.isArray(categoriesResponse) ? categoriesResponse : [],
      );
    } catch {
      setEvents([]);
      setCategories([]);
    }
  }

  async function markAsPaid(transactionId: number) {
    if (settlingId) return;

    setSettlingId(transactionId);
    setError("");

    try {
      await apiFetch(`/financial/${transactionId}/settle`, "PATCH");
      await loadTransactions();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Falha ao marcar como pago.");
    } finally {
      setSettlingId(null);
    }
  }

  function handleOpenFiltersModal() {
    setDraftFilters(filters);
    setOpenFiltersModal(true);
  }

  function handleApplyFilters() {
    setFilters(draftFilters);
    setOpenFiltersModal(false);
  }

  function handleClearFilters() {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
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
      await apiFetch(`/financial/${transaction.id}`, "DELETE");
      await loadTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir movimentação.");
    }
  }

  useEffect(() => {
    loadAuxiliaryData();
  }, []);

  useEffect(() => {
    loadTransactions(1, false);
  }, [filters]);

  return (
    <>
      <FinancialPanel
        title="Financeiro global"
        subtitle="Visão geral das movimentações de todos os eventos."
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
        showEventName
        availableEvents={events}
        availableCategories={categories}
        compactFilters
        onOpenFiltersModal={handleOpenFiltersModal}
        totalCount={totalCount}
        canManageTransactions={Boolean(user?.isAdmin)}
        onEditTransaction={(transaction) => {
          setSelectedTransaction(transaction);
          setEditModalOpen(true);
        }}
        onDeleteTransaction={handleDeleteTransaction}
      />

      <CreateGlobalTransactionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={loadTransactions}
      />

      <GlobalFinancialFiltersModal
        open={openFiltersModal}
        onClose={() => setOpenFiltersModal(false)}
        draftFilters={draftFilters}
        onDraftFiltersChange={setDraftFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        availableEvents={events}
        availableCategories={categories}
      />

      <EditTransactionModal
        open={editModalOpen}
        transaction={selectedTransaction}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedTransaction(null);
        }}
        onUpdated={loadTransactions}
      />
    </>
  );
}
