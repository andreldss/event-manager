export type CreateTransactionDto = {
    eventId: number;
    type: 'income' | 'expense';
    description: string;
    amount: number;
    categoryId?: number;
    status?: 'planned' | 'settled';
    paidAt?: string | null;
};