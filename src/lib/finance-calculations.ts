import { Transaction } from '@/types/finance';

export interface FinanceTotals {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export function calculateTotals(transactions: Transaction[]): FinanceTotals {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
}
