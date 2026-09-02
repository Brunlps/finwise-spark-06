import { Transaction } from '@/types/finance';

export type ImportedRow = Record<string, unknown>;

export function parseImportRows(
  rows: ImportedRow[],
  defaultCategoryId: string,
  defaultPaymentMethodId: string,
): Omit<Transaction, 'id'>[] {
  return rows.map(row => {
    const rawDate = row['data'] || row['Data'] || row['date'] || new Date().toISOString().split('T')[0];
    const rawDescription = row['descricao'] || row['Descrição'] || row['description'] || 'Importado';
    const rawAmount = row['valor'] || row['Valor'] || row['amount'] || 0;
    const amount = parseFloat(String(rawAmount));

    return {
      date: String(rawDate),
      description: String(rawDescription),
      amount: Math.abs(amount),
      type: (amount >= 0 ? 'income' : 'expense') as 'income' | 'expense',
      categoryId: defaultCategoryId,
      paymentMethodId: defaultPaymentMethodId,
    };
  });
}
