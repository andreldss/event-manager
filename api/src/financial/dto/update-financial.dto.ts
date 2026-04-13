export class UpdateTransactionDto {
  eventId?: number;
  type?: 'income' | 'expense';
  description?: string;
  amount?: number;
  categoryId?: number | null;
  status?: 'planned' | 'settled';
  paidAt?: string | null;
}
