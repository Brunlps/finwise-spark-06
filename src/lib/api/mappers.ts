import { Account, Category, Transaction } from '@/types/finance';
import { fromApiAmount, toApiAmount } from './money';
import {
  AccountCreatePayload,
  AccountRead,
  CategoryCreatePayload,
  CategoryRead,
  CategoryUpdatePayload,
  TransactionCreatePayload,
  TransactionRead,
  TransactionUpdatePayload,
} from './types';

// O backend guarda `date` como datetime (ex.: "2026-01-01T10:00:00"); as telas só
// trabalham com a parte de data (formato do <input type="date">, "YYYY-MM-DD"). Corta a
// string em vez de passar por `Date` para não escorregar um dia por causa de fuso.
const toDomainDate = (isoDatetime: string): string => isoDatetime.slice(0, 10);
const toApiDate = (dateOnly: string): string => `${dateOnly}T00:00:00`;

export const toAccount = (account: AccountRead): Account => ({
  id: account.id,
  name: account.name,
  balance: fromApiAmount(account.balance),
  createdAt: account.created_at,
  updatedAt: account.updated_at,
});

export const toAccountCreatePayload = (data: { name: string; balance?: number }): AccountCreatePayload => ({
  name: data.name,
  ...(data.balance !== undefined ? { balance: toApiAmount(data.balance) } : {}),
});

export const toCategory = (category: CategoryRead): Category => ({
  id: category.id,
  name: category.name,
  type: category.type,
  icon: category.icon,
  color: category.color,
});

export const toCategoryCreatePayload = (data: Omit<Category, 'id'>): CategoryCreatePayload => ({
  name: data.name,
  type: data.type,
  icon: data.icon,
  color: data.color,
});

export const toCategoryUpdatePayload = (data: Partial<Omit<Category, 'id' | 'type'>>): CategoryUpdatePayload => ({
  name: data.name,
  icon: data.icon,
  color: data.color,
});

export const toTransaction = (transaction: TransactionRead): Transaction => ({
  id: transaction.id,
  date: toDomainDate(transaction.date),
  description: transaction.description ?? '',
  amount: fromApiAmount(transaction.amount),
  type: transaction.type,
  categoryId: transaction.category_id,
  accountId: transaction.account_id,
});

export const toTransactionCreatePayload = (data: Omit<Transaction, 'id'>): TransactionCreatePayload => ({
  account_id: data.accountId,
  category_id: data.categoryId,
  amount: toApiAmount(data.amount),
  type: data.type,
  description: data.description || null,
  date: toApiDate(data.date),
});

export const toTransactionUpdatePayload = (
  data: Partial<Omit<Transaction, 'id' | 'accountId' | 'type'>>,
): TransactionUpdatePayload => ({
  ...(data.categoryId !== undefined ? { category_id: data.categoryId } : {}),
  ...(data.amount !== undefined ? { amount: toApiAmount(data.amount) } : {}),
  ...(data.description !== undefined ? { description: data.description || null } : {}),
  ...(data.date !== undefined ? { date: toApiDate(data.date) } : {}),
});
