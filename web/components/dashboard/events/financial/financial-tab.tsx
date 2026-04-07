"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import FinancialPanel from "../../financial/financial-panel";
import CreateTransactionModal from "../../financial/create-transaction-modal";
import type { FinancialFilterValues, Transaction } from "@/types/financial";

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<FinancialFilterValues>(initialFilters);
  const [openModal, setOpenModal] = useState(false);
  const [settlingId, setSettlingId] = useState<number | null>(null);

  async function loadTransactions() {
    setError("");
    setIsLoading(true);

    try {
      const response = await apiFetch(`/financial/event/${eventId}`, "GET");
      setTransactions(Array.isArray(response) ? response : []);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Falha de rede ou servidor fora do ar.");
      setTransactions([]);
    } finally {
      setIsLoading(false);
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

  useEffect(() => {
    if (!eventId) return;
    loadTransactions();
  }, [eventId, financialRefreshTrigger]);

  return (
    <>
      <FinancialPanel
        title="Movimentações do evento"
        subtitle="Entradas, saídas e despesas programadas deste evento."
        transactions={transactions}
        isLoading={isLoading}
        error={error}
        filters={filters}
        onFiltersChange={setFilters}
        onReload={loadTransactions}
        onAdd={() => setOpenModal(true)}
        onMarkAsPaid={markAsPaid}
        settlingId={settlingId}
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
    </>
  );
}
