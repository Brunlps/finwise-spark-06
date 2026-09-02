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
