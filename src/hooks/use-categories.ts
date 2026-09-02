import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api/categories-api';
import { toCategory, toCategoryCreatePayload, toCategoryUpdatePayload } from '@/lib/api/mappers';
import { Category } from '@/types/finance';
import { queryKeys } from './query-keys';

export const useCategories = () =>
  useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => (await categoriesApi.list()).map(toCategory),
  });

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Category, 'id'>) => categoriesApi.create(toCategoryCreatePayload(data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Omit<Category, 'id' | 'type'>> & { id: string }) =>
      categoriesApi.update(id, toCategoryUpdatePayload(data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  });
};
