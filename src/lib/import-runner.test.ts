import { describe, it, expect, vi } from 'vitest';
import { runWithConcurrency, importTransactionRows } from './import-runner';
import { ApiError } from './api/api-client';
import { Transaction } from '@/types/finance';

const row = (overrides: Partial<Omit<Transaction, 'id'>> = {}): Omit<Transaction, 'id'> => ({
  date: '2026-01-01',
  description: 'Linha',
  amount: 10,
  type: 'income',
  categoryId: 'cat-1',
  accountId: 'acc-1',
  ...overrides,
});

describe('runWithConcurrency', () => {
  it('nunca executa mais que `limit` workers ao mesmo tempo', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const items = Array.from({ length: 12 }, (_, i) => i);

    await runWithConcurrency(items, 3, async (item) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
      return item * 2;
    });

    expect(maxInFlight).toBeLessThanOrEqual(3);
  });

  it('preserva a ordem original dos resultados independente da ordem de conclusão', async () => {
    const items = [30, 10, 20];
    const results = await runWithConcurrency(items, 3, async (ms) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return ms;
    });
    expect(results.map((r) => (r.status === 'fulfilled' ? r.value : null))).toEqual([30, 10, 20]);
  });

  it('captura rejeições individualmente sem interromper as outras', async () => {
    const results = await runWithConcurrency([1, 2, 3], 2, async (n) => {
      if (n === 2) throw new Error('falhou');
      return n;
    });
    expect(results[0]).toEqual({ status: 'fulfilled', value: 1 });
    expect(results[1].status).toBe('rejected');
    expect(results[2]).toEqual({ status: 'fulfilled', value: 3 });
  });
});

describe('importTransactionRows', () => {
  it('todas as linhas bem-sucedidas: succeeded = total, failed vazio', async () => {
    const rows = [row(), row(), row()];
    const createTransaction = vi.fn().mockResolvedValue({ id: 'new' });

    const outcome = await importTransactionRows(rows, createTransaction);

    expect(outcome).toEqual({ succeeded: 3, failed: [] });
    expect(createTransaction).toHaveBeenCalledTimes(3);
  });

  it('falha parcial: linhas com erro aparecem em failed com o motivo, sem perder as que deram certo', async () => {
    const rows = [row({ description: 'ok-1' }), row({ description: 'ruim' }), row({ description: 'ok-2' })];
    const createTransaction = vi.fn().mockImplementation(async (r: Omit<Transaction, 'id'>) => {
      if (r.description === 'ruim') throw new ApiError(422, 'Categoria inválida');
      return { id: 'new' };
    });

    const outcome = await importTransactionRows(rows, createTransaction);

    expect(outcome.succeeded).toBe(2);
    expect(outcome.failed).toHaveLength(1);
    expect(outcome.failed[0]).toEqual({ row: rows[1], reason: 'Categoria inválida' });
  });

  it('erro genérico (não ApiError) também é reportado com uma mensagem', async () => {
    const rows = [row()];
    const createTransaction = vi.fn().mockRejectedValue(new Error('rede caiu'));

    const outcome = await importTransactionRows(rows, createTransaction);

    expect(outcome.succeeded).toBe(0);
    expect(outcome.failed[0].reason).toBe('rede caiu');
  });

  it('respeita o limite de concorrência informado', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const rows = Array.from({ length: 8 }, () => row());
    const createTransaction = vi.fn().mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
      return { id: 'new' };
    });

    await importTransactionRows(rows, createTransaction, 2);

    expect(maxInFlight).toBeLessThanOrEqual(2);
  });
});
