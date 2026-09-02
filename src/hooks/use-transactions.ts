import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '@/lib/api/transactions-api';
import { toTransaction, toTransactionCreatePayload, toTransactionUpdatePayload } from '@/lib/api/mappers';
import { Transaction } from '@/types/finance';
import { queryKeys } from './query-keys';

export const useTransactions = () =>
  useQuery({
    queryKey: queryKeys.transactions,
    queryFn: async () => (await transactionsApi.list()).map(toTransaction),
  });

// Criar/editar/excluir uma transação muda o saldo da conta no backend, então essas
// mutations sempre invalidam contas junto com transações.
const invalidateFinanceQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
  queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Transaction, 'id'>) => transactionsApi.create(toTransactionCreatePayload(data)),
    onSuccess: () => invalidateFinanceQueries(queryClient),
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Omit<Transaction, 'id' | 'accountId' | 'type'>> & { id: string }) =>
      transactionsApi.update(id, toTransactionUpdatePayload(data)),
    onSuccess: () => invalidateFinanceQueries(queryClient),
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsApi.remove(id),
    onSuccess: () => invalidateFinanceQueries(queryClient),
  });
};
