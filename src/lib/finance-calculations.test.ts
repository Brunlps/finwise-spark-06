import { describe, it, expect } from 'vitest';
import { calculateTotals, sumAccountBalances, groupExpensesByCategory, calculateMonthlyData } from './finance-calculations';
import { Account, Category, Transaction } from '@/types/finance';

const tx = (overrides: Partial<Transaction>): Transaction => ({
  id: 't-x',
  date: '2025-02-01',
  description: 'Transação',
  amount: 0,
  type: 'income',
  categoryId: 'cat-1',
  accountId: 'acc-1',
  ...overrides,
});

const account = (overrides: Partial<Account>): Account => ({
  id: 'acc-x',
  name: 'Conta',
  balance: 0,
  createdAt: '2025-01-01T00:00:00',
  updatedAt: '2025-01-01T00:00:00',
  ...overrides,
});

const category = (overrides: Partial<Category>): Category => ({
  id: 'cat-x',
  name: 'Categoria',
  type: 'expense',
  icon: null,
  color: '#000000',
  ...overrides,
});

describe('calculateTotals', () => {
  it('lista vazia resulta em totais e saldo zerados', () => {
    expect(calculateTotals([])).toEqual({ totalIncome: 0, totalExpenses: 0, balance: 0 });
  });

  it('soma receitas e despesas e calcula o saldo (receitas > despesas)', () => {
    const totals = calculateTotals([
      tx({ type: 'income', amount: 8500 }),
      tx({ type: 'expense', amount: 450.3 }),
      tx({ type: 'expense', amount: 2200 }),
    ]);
    expect(totals.totalIncome).toBe(8500);
    expect(totals.totalExpenses).toBe(2650.3);
    expect(totals.balance).toBe(5849.7);
  });

  it('saldo fica negativo quando despesas superam receitas', () => {
    const totals = calculateTotals([
      tx({ type: 'income', amount: 1000 }),
      tx({ type: 'expense', amount: 1500 }),
    ]);
    expect(totals.balance).toBe(-500);
  });

  it('apenas despesas: receita total é zero', () => {
    const totals = calculateTotals([
      tx({ type: 'expense', amount: 100 }),
      tx({ type: 'expense', amount: 50 }),
    ]);
    expect(totals.totalIncome).toBe(0);
    expect(totals.totalExpenses).toBe(150);
    expect(totals.balance).toBe(-150);
  });

  it('apenas receitas: despesa total é zero e saldo igual à receita', () => {
    const totals = calculateTotals([
      tx({ type: 'income', amount: 200 }),
      tx({ type: 'income', amount: 300 }),
    ]);
    expect(totals.totalExpenses).toBe(0);
    expect(totals.balance).toBe(500);
  });

  it('mantém precisão aceitável com valores monetários fracionados', () => {
    const totals = calculateTotals([
      tx({ type: 'income', amount: 10.1 }),
      tx({ type: 'expense', amount: 5.05 }),
      tx({ type: 'expense', amount: 0.3 }),
    ]);
    expect(totals.balance).toBeCloseTo(4.75, 2);
  });
});

describe('sumAccountBalances', () => {
  it('lista vazia resulta em zero', () => {
    expect(sumAccountBalances([])).toBe(0);
  });

  it('soma o saldo de todas as contas', () => {
    const total = sumAccountBalances([account({ balance: 100 }), account({ balance: -30.5 }), account({ balance: 5 })]);
    expect(total).toBeCloseTo(74.5, 2);
  });
});

describe('groupExpensesByCategory', () => {
  const categories = [
    category({ id: 'cat-1', name: 'Alimentação', color: '#f97316' }),
    category({ id: 'cat-2', name: 'Transporte', color: '#3b82f6' }),
  ];

  it('ignora receitas e agrupa só despesas por categoria', () => {
    const result = groupExpensesByCategory(
      [
        tx({ type: 'expense', categoryId: 'cat-1', amount: 100 }),
        tx({ type: 'expense', categoryId: 'cat-1', amount: 50 }),
        tx({ type: 'expense', categoryId: 'cat-2', amount: 30 }),
        tx({ type: 'income', categoryId: 'cat-1', amount: 1000 }),
      ],
      categories,
    );
    expect(result).toEqual([
      { categoryId: 'cat-1', name: 'Alimentação', value: 150, color: '#f97316' },
      { categoryId: 'cat-2', name: 'Transporte', value: 30, color: '#3b82f6' },
    ]);
  });

  it('ordena do maior para o menor valor', () => {
    const result = groupExpensesByCategory(
      [
        tx({ type: 'expense', categoryId: 'cat-2', amount: 10 }),
        tx({ type: 'expense', categoryId: 'cat-1', amount: 500 }),
      ],
      categories,
    );
    expect(result.map(r => r.categoryId)).toEqual(['cat-1', 'cat-2']);
  });

  it('categoria nula ou desconhecida cai em "Outro" com cor padrão', () => {
    const result = groupExpensesByCategory([tx({ type: 'expense', categoryId: null, amount: 20 })], categories);
    expect(result).toEqual([{ categoryId: null, name: 'Outro', value: 20, color: '#94a3b8' }]);
  });
});

describe('calculateMonthlyData', () => {
  it('retorna os 12 meses do ano, mesmo sem transações', () => {
    const result = calculateMonthlyData([], '2025');
    expect(result).toHaveLength(12);
    expect(result[0]).toEqual({ name: 'Jan', receitas: 0, despesas: 0, saldo: 0 });
  });

  it('agrega receitas e despesas por mês, ignorando outros anos', () => {
    const result = calculateMonthlyData(
      [
        tx({ date: '2025-02-01', type: 'income', amount: 1000 }),
        tx({ date: '2025-02-15', type: 'expense', amount: 300 }),
        tx({ date: '2024-02-15', type: 'expense', amount: 9999 }),
      ],
      '2025',
    );
    const fev = result[1];
    expect(fev).toEqual({ name: 'Fev', receitas: 1000, despesas: 300, saldo: 700 });
  });
});
