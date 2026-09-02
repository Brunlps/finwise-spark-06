import { describe, it, expect } from 'vitest';
import { calculateTotals } from './finance-calculations';
import { Transaction } from '@/types/finance';

const tx = (overrides: Partial<Transaction>): Transaction => ({
  id: 't-x',
  date: '2025-02-01',
  description: 'Transação',
  amount: 0,
  type: 'income',
  categoryId: 'cat-1',
  paymentMethodId: 'pm-1',
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
