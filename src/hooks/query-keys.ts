export const queryKeys = {
  accounts: ['accounts'] as const,
  account: (id: string) => ['accounts', id] as const,
  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,
  transactions: ['transactions'] as const,
  transaction: (id: string) => ['transactions', id] as const,
};
