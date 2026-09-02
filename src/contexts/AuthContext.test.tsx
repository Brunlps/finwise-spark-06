import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authApi } from '@/lib/api/auth-api';
import { ApiError } from '@/lib/api/api-client';
import { tokenStore } from '@/lib/api/token-store';

vi.mock('@/lib/api/auth-api', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    loginTwoFactor: vi.fn(),
    logout: vi.fn(),
  },
}));

// JWT fake só para o claim "sub" ser lido por decodeUserId (payload = {"sub":"user-1"}).
const fakeAccessToken = (sub: string) => `header.${btoa(JSON.stringify({ sub }))}.signature`;

const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => {
  localStorage.clear();
  tokenStore.clear();
  vi.clearAllMocks();
});

describe('AuthContext', () => {
  it('login bem-sucedido autentica o usuário', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      access_token: fakeAccessToken('user-1'),
      refresh_token: 'refresh-1',
      token_type: 'bearer',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let response: { twoFactorRequired: boolean } | undefined;
    await act(async () => {
      response = await result.current.login('user@example.com', 'password123');
    });

    expect(response).toEqual({ twoFactorRequired: false });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: 'user-1', email: 'user@example.com' });
  });

  it('login de usuário com 2FA ativo pede o código e só autentica após confirmá-lo', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ two_factor_required: true, two_factor_token: 'tmp-token' });
    vi.mocked(authApi.loginTwoFactor).mockResolvedValue({
      access_token: fakeAccessToken('user-2'),
      refresh_token: 'refresh-2',
      token_type: 'bearer',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let response: { twoFactorRequired: boolean } | undefined;
    await act(async () => {
      response = await result.current.login('user2@example.com', 'password123');
    });

    expect(response).toEqual({ twoFactorRequired: true });
    expect(result.current.twoFactorPending).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);

    await act(async () => {
      await result.current.confirmTwoFactor('123456');
    });

    expect(authApi.loginTwoFactor).toHaveBeenCalledWith('tmp-token', '123456');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.twoFactorPending).toBe(false);
    expect(result.current.user?.email).toBe('user2@example.com');
  });

  it('login com credenciais inválidas propaga o erro e mantém deslogado', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new ApiError(401, 'Credenciais inválidas'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.login('user@example.com', 'senha-errada');
      }),
    ).rejects.toThrow('Credenciais inválidas');

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('logout best-effort limpa a sessão local mesmo se a chamada à API falhar', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      access_token: fakeAccessToken('user-3'),
      refresh_token: 'refresh-3',
      token_type: 'bearer',
    });
    vi.mocked(authApi.logout).mockRejectedValue(new ApiError(500, 'erro interno'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('user3@example.com', 'password123');
    });
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(authApi.logout).toHaveBeenCalledWith('refresh-3');
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getRefreshToken()).toBeNull();
  });
});
