"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import FinancialPanel from "@/components/dashboard/financial/financial-panel";
import CreateGlobalTransactionModal from "@/components/dashboard/financial/create-global-transaction-modal";
import GlobalFinancialFiltersModal from "@/components/dashboard/financial/global-financial-filters-modal";
import type {
  FinancialFilterValues,
  FinancialOption,
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<FinancialFilterValues>(initialFilters);
  const [draftFilters, setDraftFilters] =
    useState<FinancialFilterValues>(initialFilters);
  const [openModal, setOpenModal] = useState(false);
  const [openFiltersModal, setOpenFiltersModal] = useState(false);
  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [events, setEvents] = useState<FinancialOption[]>([]);
  const [categories, setCategories] = useState<FinancialOption[]>([]);

  async function loadTransactions() {
    setError("");
    setIsLoading(true);

    try {
      const response = await apiFetch("/financial", "GET");
      setTransactions(Array.isArray(response) ? response : []);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Falha de rede ou servidor fora do ar.");
      setTransactions([]);
    } finally {
      setIsLoading(false);
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

  useEffect(() => {
    loadTransactions();
    loadAuxiliaryData();
  }, []);

  return (
    <>
      <FinancialPanel
        title="Financeiro global"
        subtitle="Visão geral das movimentações de todos os eventos."
        transactions={transactions}
        isLoading={isLoading}
        error={error}
        filters={filters}
        onFiltersChange={setFilters}
        onReload={loadTransactions}
        onAdd={() => setOpenModal(true)}
        onMarkAsPaid={markAsPaid}
        settlingId={settlingId}
        showEventName
        availableEvents={events}
        availableCategories={categories}
        compactFilters
        onOpenFiltersModal={handleOpenFiltersModal}
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
    </>
  );
}
