import { API_URL } from '@/lib/env';
import { tokenStore } from './token-store';
import { TokenPair } from './types';

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

const defaultMessageForStatus = (status: number): string => {
  switch (status) {
    case 401:
      return 'Sessão expirada ou credenciais inválidas.';
    case 403:
      return 'Você não tem permissão para realizar essa ação.';
    case 404:
      return 'Recurso não encontrado.';
    case 409:
      return 'Já existe um registro com esses dados.';
    case 429:
      return 'Muitas tentativas. Aguarde um minuto e tente novamente.';
    default:
      return 'Ocorreu um erro inesperado. Tente novamente.';
  }
};

// FastAPI devolve {"detail": "mensagem"} nos erros "de negócio" (401/403/404/409/429) e
// {"detail": [{"msg": "...", ...}, ...]} nos erros de validação do Pydantic (422).
const extractDetail = async (res: Response): Promise<string> => {
  try {
    const data = await res.json();
    if (typeof data?.detail === 'string') return data.detail;
    if (Array.isArray(data?.detail)) {
      const messages = data.detail.map((issue: { msg?: string }) => issue.msg).filter(Boolean);
      if (messages.length) return messages.join('; ');
    }
  } catch {
    // corpo vazio ou não-JSON: cai no fallback abaixo
  }
  return defaultMessageForStatus(res.status);
};

// Deduplica chamadas concorrentes a /auth/refresh: se várias requisições protegidas
// tomam 401 ao mesmo tempo, todas aguardam essa única Promise em vez de disparar
// um refresh cada uma (o que invalidaria o refresh_token das outras, já que o backend
// rotaciona o token a cada uso).
let refreshInFlight: Promise<boolean> | null = null;

const performRefresh = async (): Promise<boolean> => {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      tokenStore.clear();
      return false;
    }
    const pair: TokenPair = await res.json();
    tokenStore.setTokens(pair);
    return true;
  } catch {
    tokenStore.clear();
    return false;
  }
};

export const refreshSession = (): Promise<boolean> => {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Anexa o Authorization: Bearer automaticamente e tenta refresh em 401. Default true. */
  auth?: boolean;
}

const request = async <T>(
  path: string,
  { method = 'GET', body, auth = true }: RequestOptions,
  isRetry = false,
): Promise<T> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const accessToken = tokenStore.getAccessToken();
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && !isRetry) {
    const refreshed = await refreshSession();
    if (refreshed) return request<T>(path, { method, body, auth }, true);
  }

  if (!res.ok) {
    throw new ApiError(res.status, await extractDetail(res));
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
};

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
