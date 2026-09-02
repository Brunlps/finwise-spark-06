import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/lib/api/accounts-api';
import { toAccount, toAccountCreatePayload } from '@/lib/api/mappers';
import { queryKeys } from './query-keys';

export const useAccounts = () =>
  useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => (await accountsApi.list()).map(toAccount),
  });

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; balance?: number }) => accountsApi.create(toAccountCreatePayload(data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.accounts }),
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => accountsApi.update(id, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.accounts }),
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.accounts }),
  });
};
