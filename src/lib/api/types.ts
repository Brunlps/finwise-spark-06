export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface TwoFactorChallenge {
  two_factor_required: true;
  two_factor_token: string;
}

export interface UserRead {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export const isTwoFactorChallenge = (
  result: TokenPair | TwoFactorChallenge,
): result is TwoFactorChallenge => 'two_factor_required' in result;

export interface TwoFactorSetupResponse {
  secret: string;
  provisioning_uri: string;
}

// Tipos "de arame": o formato exato que a API manda/espera (snake_case, valores
// monetários como string decimal — ver app/schemas/*.py no backend). A conversão para os
// tipos de domínio usados pelas telas (src/types/finance.ts) é feita só em
// src/lib/api/mappers.ts.

export interface AccountRead {
  id: string;
  user_id: string;
  name: string;
  balance: string;
  created_at: string;
  updated_at: string;
}

export interface AccountCreatePayload {
  name: string;
  balance?: string;
}

export interface AccountUpdatePayload {
  name?: string;
}

export type CategoryType = 'income' | 'expense';

export interface CategoryRead {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface CategoryCreatePayload {
  name: string;
  type: CategoryType;
  icon?: string | null;
  color?: string | null;
}

export interface CategoryUpdatePayload {
  name?: string;
  icon?: string | null;
  color?: string | null;
}

export interface TransactionRead {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  amount: string;
  type: CategoryType;
  description: string | null;
  date: string;
  created_at: string;
}

export interface TransactionCreatePayload {
  account_id: string;
  category_id?: string | null;
  amount: string;
  type: CategoryType;
  description?: string | null;
  date: string;
}

export interface TransactionUpdatePayload {
  category_id?: string | null;
  amount?: string;
  description?: string | null;
  date?: string;
}
