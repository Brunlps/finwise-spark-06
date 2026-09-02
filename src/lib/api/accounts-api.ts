import { apiClient } from './api-client';
import { AccountCreatePayload, AccountRead, AccountUpdatePayload } from './types';

export const accountsApi = {
  list: () => apiClient.get<AccountRead[]>('/accounts'),
  get: (id: string) => apiClient.get<AccountRead>(`/accounts/${id}`),
  create: (data: AccountCreatePayload) => apiClient.post<AccountRead>('/accounts', data),
  update: (id: string, data: AccountUpdatePayload) => apiClient.patch<AccountRead>(`/accounts/${id}`, data),
  remove: (id: string) => apiClient.delete<void>(`/accounts/${id}`),
};
