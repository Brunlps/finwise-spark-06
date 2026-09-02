import { apiClient } from './api-client';
import { CategoryCreatePayload, CategoryRead, CategoryUpdatePayload } from './types';

export const categoriesApi = {
  list: () => apiClient.get<CategoryRead[]>('/categories'),
  get: (id: string) => apiClient.get<CategoryRead>(`/categories/${id}`),
  create: (data: CategoryCreatePayload) => apiClient.post<CategoryRead>('/categories', data),
  update: (id: string, data: CategoryUpdatePayload) => apiClient.patch<CategoryRead>(`/categories/${id}`, data),
  remove: (id: string) => apiClient.delete<void>(`/categories/${id}`),
};
