import { Transaction, Category, PaymentMethod } from '@/types/finance';

export const defaultCategories: Category[] = [
  { id: 'cat-1', name: 'Alimentação', color: '#f97316' },
  { id: 'cat-2', name: 'Transporte', color: '#3b82f6' },
  { id: 'cat-3', name: 'Moradia', color: '#8b5cf6' },
  { id: 'cat-4', name: 'Saúde', color: '#ef4444' },
  { id: 'cat-5', name: 'Lazer', color: '#ec4899' },
  { id: 'cat-6', name: 'Educação', color: '#06b6d4' },
  { id: 'cat-7', name: 'Salário', color: '#22c55e' },
  { id: 'cat-8', name: 'Freelance', color: '#14b8a6' },
];

export const defaultPaymentMethods: PaymentMethod[] = [
  { id: 'pm-1', name: 'Cartão de Crédito' },
  { id: 'pm-2', name: 'Cartão de Débito' },
  { id: 'pm-3', name: 'PIX' },
  { id: 'pm-4', name: 'Dinheiro' },
  { id: 'pm-5', name: 'Transferência' },
];

export const defaultTransactions: Transaction[] = [
  { id: 't-1', date: '2025-02-01', description: 'Salário mensal', amount: 8500, type: 'income', categoryId: 'cat-7', paymentMethodId: 'pm-5' },
  { id: 't-2', date: '2025-02-02', description: 'Supermercado', amount: 450.30, type: 'expense', categoryId: 'cat-1', paymentMethodId: 'pm-2' },
  { id: 't-3', date: '2025-02-03', description: 'Aluguel', amount: 2200, type: 'expense', categoryId: 'cat-3', paymentMethodId: 'pm-5' },
  { id: 't-4', date: '2025-02-05', description: 'Uber', amount: 35.90, type: 'expense', categoryId: 'cat-2', paymentMethodId: 'pm-1' },
  { id: 't-5', date: '2025-02-06', description: 'Projeto freelance', amount: 2000, type: 'income', categoryId: 'cat-8', paymentMethodId: 'pm-3' },
  { id: 't-6', date: '2025-02-07', description: 'Farmácia', amount: 89.50, type: 'expense', categoryId: 'cat-4', paymentMethodId: 'pm-2' },
  { id: 't-7', date: '2025-02-08', description: 'Cinema', amount: 65, type: 'expense', categoryId: 'cat-5', paymentMethodId: 'pm-1' },
  { id: 't-8', date: '2025-02-10', description: 'Curso online', amount: 197, type: 'expense', categoryId: 'cat-6', paymentMethodId: 'pm-1' },
  { id: 't-9', date: '2025-02-11', description: 'Restaurante', amount: 120, type: 'expense', categoryId: 'cat-1', paymentMethodId: 'pm-1' },
  { id: 't-10', date: '2025-02-12', description: 'Gasolina', amount: 250, type: 'expense', categoryId: 'cat-2', paymentMethodId: 'pm-2' },
];
