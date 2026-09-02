import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '@/types/finance';
import { authApi } from '@/lib/api/auth-api';
import { refreshSession, ApiError } from '@/lib/api/api-client';
import { tokenStore } from '@/lib/api/token-store';
import { decodeUserId } from '@/lib/api/jwt';
import { isTwoFactorChallenge, TokenPair } from '@/lib/api/types';

// O e-mail não vem em nenhuma resposta de /auth/login ou /auth/2fa/login (só o TokenPair),
// então guardamos aqui o e-mail digitado no formulário para poder montar o objeto User (e
// reidratar a UI depois de um F5, junto com o refresh_token). Não é dado sensível.
const EMAIL_STORAGE_KEY = 'gerfinance_email';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** true enquanto se aguarda o código TOTP de um login com 2FA ativo */
  twoFactorPending: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<{ twoFactorRequired: boolean }>;
  confirmTwoFactor: (code: string) => Promise<void>;
  cancelTwoFactor: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const buildUser = (accessToken: string, email: string): User => ({
  id: decodeUserId(accessToken) ?? '',
  email,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // Bootstrap: se sobrou um refresh_token de uma sessão anterior, troca por um access_token
  // novo antes de liberar as rotas protegidas. Se falhar (expirado/revogado), trata como
  // deslogado.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!tokenStore.getRefreshToken()) {
        setIsLoading(false);
        return;
      }
      const ok = await refreshSession();
      if (cancelled) return;
      const accessToken = tokenStore.getAccessToken();
      if (ok && accessToken) {
        setUser(buildUser(accessToken, localStorage.getItem(EMAIL_STORAGE_KEY) ?? ''));
      } else {
        localStorage.removeItem(EMAIL_STORAGE_KEY);
      }
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Se o token_store for limpo por fora (ex.: um refresh automático falhou durante uma
  // chamada protegida), reflete isso deslogando o usuário na UI.
  useEffect(
    () =>
      tokenStore.subscribe(() => {
        if (!tokenStore.getAccessToken()) {
          setUser((prev) => (prev ? null : prev));
        }
      }),
    [],
  );

  const applySession = useCallback((tokens: TokenPair, email: string) => {
    tokenStore.setTokens(tokens);
    localStorage.setItem(EMAIL_STORAGE_KEY, email);
    setUser(buildUser(tokens.access_token, email));
    setTwoFactorToken(null);
    setPendingEmail(null);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    await authApi.register(email, password);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authApi.login(email, password);
      if (isTwoFactorChallenge(result)) {
        setTwoFactorToken(result.two_factor_token);
        setPendingEmail(email);
        return { twoFactorRequired: true };
      }
      applySession(result, email);
      return { twoFactorRequired: false };
    },
    [applySession],
  );

  const confirmTwoFactor = useCallback(
    async (code: string) => {
      if (!twoFactorToken) throw new ApiError(400, 'Nenhum desafio de 2FA em andamento.');
      const tokens = await authApi.loginTwoFactor(twoFactorToken, code);
      applySession(tokens, pendingEmail ?? '');
    },
    [twoFactorToken, pendingEmail, applySession],
  );

  const cancelTwoFactor = useCallback(() => {
    setTwoFactorToken(null);
    setPendingEmail(null);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.getRefreshToken();
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // best-effort: mesmo que a chamada falhe, a sessão local é encerrada abaixo
    } finally {
      tokenStore.clear();
      localStorage.removeItem(EMAIL_STORAGE_KEY);
      setUser(null);
      setTwoFactorToken(null);
      setPendingEmail(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        twoFactorPending: !!twoFactorToken,
        register,
        login,
        confirmTwoFactor,
        cancelTwoFactor,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
