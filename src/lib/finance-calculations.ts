import { Account, Category, Transaction } from '@/types/finance';

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

// O saldo "de verdade" vem das contas (o backend deriva balance das transações,
// inclusive de ajustes/edições históricas) — não de somar transactions.amount no
// frontend, que pode divergir se nem todas as transações estiverem carregadas.
export function sumAccountBalances(accounts: Account[]): number {
  return accounts.reduce((sum, account) => sum + account.balance, 0);
}

export interface CategoryBreakdownItem {
  categoryId: string | null;
  name: string;
  value: number;
  color: string;
}

export function groupExpensesByCategory(transactions: Transaction[], categories: Category[]): CategoryBreakdownItem[] {
  const totals = new Map<string | null, number>();
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount));

  return Array.from(totals.entries())
    .map(([categoryId, value]) => {
      const category = categories.find(c => c.id === categoryId);
      return { categoryId, name: category?.name ?? 'Outro', value, color: category?.color ?? '#94a3b8' };
    })
    .sort((a, b) => b.value - a.value);
}

export interface MonthlyDataPoint {
  name: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function calculateMonthlyData(transactions: Transaction[], year: string): MonthlyDataPoint[] {
  return MONTH_NAMES.map((name, i) => {
    const prefix = `${year}-${String(i + 1).padStart(2, '0')}`;
    const income = transactions
      .filter(t => t.date.startsWith(prefix) && t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expenses = transactions
      .filter(t => t.date.startsWith(prefix) && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return { name: name.substring(0, 3), receitas: income, despesas: expenses, saldo: income - expenses };
  });
}
