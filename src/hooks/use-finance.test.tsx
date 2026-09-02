import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccounts } from './use-accounts';
import { useTransactions, useCreateTransaction } from './use-transactions';
import { useDeleteCategory } from './use-categories';
import { tokenStore } from '@/lib/api/token-store';

const jsonResponse = (status: number, data: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  }) as Response;

const fetchMock = vi.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
};

const countCalls = (path: string, method: string) =>
  fetchMock.mock.calls.filter(
    ([url, init]: [string, RequestInit | undefined]) =>
      String(url).endsWith(path) && (init?.method ?? 'GET') === method,
  ).length;

beforeEach(() => {
  localStorage.clear();
  tokenStore.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('useAccounts', () => {
  it('busca as contas e mapeia balance de string decimal para number', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, [
        { id: 'acc-1', user_id: 'u1', name: 'Carteira', balance: '100.50', created_at: 'c', updated_at: 'u' },
      ]),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAccounts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      { id: 'acc-1', name: 'Carteira', balance: 100.5, createdAt: 'c', updatedAt: 'u' },
    ]);
  });
});

describe('useCreateTransaction', () => {
  it('invalida accounts e transactions após criar (o saldo da conta muda no backend)', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (method === 'POST' && url.endsWith('/transactions')) {
        return Promise.resolve(
          jsonResponse(201, {
            id: 't-1',
            user_id: 'u1',
            account_id: 'acc-1',
            category_id: null,
            amount: '10.00',
            type: 'income',
            description: null,
            date: '2026-01-01T00:00:00',
            created_at: '2026-01-01T00:00:00',
          }),
        );
      }
      return Promise.resolve(jsonResponse(200, []));
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => ({
        accounts: useAccounts(),
        transactions: useTransactions(),
        createTransaction: useCreateTransaction(),
      }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.accounts.isSuccess).toBe(true);
      expect(result.current.transactions.isSuccess).toBe(true);
    });
    expect(countCalls('/accounts', 'GET')).toBe(1);
    expect(countCalls('/transactions', 'GET')).toBe(1);

    await act(async () => {
      await result.current.createTransaction.mutateAsync({
        date: '2026-01-01',
        description: 'Nova',
        amount: 10,
        type: 'income',
        categoryId: null,
        accountId: 'acc-1',
      });
    });

    await waitFor(() => {
      expect(countCalls('/accounts', 'GET')).toBe(2);
      expect(countCalls('/transactions', 'GET')).toBe(2);
    });
  });
});

describe('useDeleteCategory', () => {
  it('propaga ApiError 409 quando a categoria está vinculada a transações', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(409, { detail: 'Categoria em uso' }));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteCategory(), { wrapper });

    await expect(result.current.mutateAsync('cat-1')).rejects.toMatchObject({
      status: 409,
      detail: 'Categoria em uso',
    });
  });
});
