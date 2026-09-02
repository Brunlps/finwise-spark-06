import { apiClient } from './api-client';
import { TransactionCreatePayload, TransactionRead, TransactionUpdatePayload } from './types';

export const transactionsApi = {
  list: () => apiClient.get<TransactionRead[]>('/transactions'),
  get: (id: string) => apiClient.get<TransactionRead>(`/transactions/${id}`),
  create: (data: TransactionCreatePayload) => apiClient.post<TransactionRead>('/transactions', data),
  update: (id: string, data: TransactionUpdatePayload) =>
    apiClient.patch<TransactionRead>(`/transactions/${id}`, data),
  remove: (id: string) => apiClient.delete<void>(`/transactions/${id}`),
};
