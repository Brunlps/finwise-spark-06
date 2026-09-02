import { ApiError } from './api/api-client';
import { Transaction } from '@/types/finance';

// Fan-out com no máximo `limit` chamadas em voo ao mesmo tempo — o backend não tem
// endpoint de importação em lote, então cada linha da planilha vira um POST
// /transactions separado; sem limite, uma planilha grande dispararia uma requisição por
// linha de uma vez só.
export async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;

  const runNext = async (): Promise<void> => {
    const current = cursor++;
    if (current >= items.length) return;
    try {
      const value = await worker(items[current], current);
      results[current] = { status: 'fulfilled', value };
    } catch (reason) {
      results[current] = { status: 'rejected', reason };
    }
    return runNext();
  };

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, runNext));
  return results;
}

export interface ImportFailure {
  row: Omit<Transaction, 'id'>;
  reason: string;
}

export interface ImportOutcome {
  succeeded: number;
  failed: ImportFailure[];
}

const describeImportError = (reason: unknown): string => {
  if (reason instanceof ApiError) return reason.detail;
  if (reason instanceof Error) return reason.message;
  return 'Erro desconhecido ao importar esta linha.';
};

const DEFAULT_CONCURRENCY = 5;

export async function importTransactionRows(
  rows: Omit<Transaction, 'id'>[],
  createTransaction: (row: Omit<Transaction, 'id'>) => Promise<unknown>,
  concurrency: number = DEFAULT_CONCURRENCY,
): Promise<ImportOutcome> {
  const settled = await runWithConcurrency(rows, concurrency, createTransaction);

  const failed: ImportFailure[] = [];
  let succeeded = 0;
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      succeeded += 1;
    } else {
      failed.push({ row: rows[index], reason: describeImportError(result.reason) });
    }
  });

  return { succeeded, failed };
}
