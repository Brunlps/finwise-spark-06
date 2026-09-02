import { apiClient } from './api-client';
import { TokenPair, TwoFactorChallenge, UserRead } from './types';

export const authApi = {
  register: (email: string, password: string) =>
    apiClient.post<UserRead>('/auth/register', { email, password }, { auth: false }),

  login: (email: string, password: string) =>
    apiClient.post<TokenPair | TwoFactorChallenge>('/auth/login', { email, password }, { auth: false }),

  loginTwoFactor: (twoFactorToken: string, code: string) =>
    apiClient.post<TokenPair>(
      '/auth/2fa/login',
      { two_factor_token: twoFactorToken, code },
      { auth: false },
    ),

  logout: (refreshToken: string) => apiClient.post<void>('/auth/logout', { refresh_token: refreshToken }),
};
