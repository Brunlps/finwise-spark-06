import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError } from './api-client';
import { tokenStore } from './token-store';

const jsonResponse = (status: number, data: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  }) as Response;

const fetchMock = vi.fn();

beforeEach(() => {
  localStorage.clear();
  tokenStore.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('apiClient', () => {
  it('injeta o header Authorization quando há access_token em memória', async () => {
    tokenStore.setTokens({ access_token: 'abc', refresh_token: 'refresh', token_type: 'bearer' });
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await apiClient.get('/accounts');

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer abc');
  });

  it('não injeta Authorization quando a chamada é marcada como auth: false', async () => {
    tokenStore.setTokens({ access_token: 'abc', refresh_token: 'refresh', token_type: 'bearer' });
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {}));

    await apiClient.post('/auth/login', { email: 'a@a.com', password: 'senha123' }, { auth: false });

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('mapeia um erro 409 para ApiError usando o detail do corpo da resposta', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(409, { detail: 'Já existe uma conta com esse e-mail.' }));

    await expect(apiClient.post('/auth/register', {}, { auth: false })).rejects.toMatchObject({
      status: 409,
      detail: 'Já existe uma conta com esse e-mail.',
    });
  });

  it('usa uma mensagem padrão quando o corpo do erro não traz detail', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(429, {}));

    await expect(apiClient.post('/auth/login', {}, { auth: false })).rejects.toMatchObject({
      status: 429,
      detail: 'Muitas tentativas. Aguarde um minuto e tente novamente.',
    });
  });

  it('renova o token automaticamente em 401 e repete a chamada original', async () => {
    tokenStore.setTokens({ access_token: 'expired-access', refresh_token: 'old-refresh', token_type: 'bearer' });

    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'expired' })) // chamada original
      .mockResolvedValueOnce(
        jsonResponse(200, { access_token: 'new-access', refresh_token: 'new-refresh', token_type: 'bearer' }),
      ) // POST /auth/refresh
      .mockResolvedValueOnce(jsonResponse(200, { data: 'ok' })); // chamada original repetida

    const result = await apiClient.get('/accounts');

    expect(result).toEqual({ data: 'ok' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh');
    expect(tokenStore.getAccessToken()).toBe('new-access');
  });

  it('propaga o erro 401 e limpa a sessão quando o refresh também falha', async () => {
    tokenStore.setTokens({ access_token: 'expired-access', refresh_token: 'old-refresh', token_type: 'bearer' });

    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'expired' })) // chamada original
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'refresh token inválido' })); // /auth/refresh falha

    await expect(apiClient.get('/accounts')).rejects.toBeInstanceOf(ApiError);
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getRefreshToken()).toBeNull();
  });

  it('deduplica refreshes concorrentes: N chamadas em 401 disparam só um /auth/refresh', async () => {
    tokenStore.setTokens({ access_token: 'expired-access', refresh_token: 'old-refresh', token_type: 'bearer' });

    let refreshCalls = 0;
    fetchMock.mockImplementation((url: string) => {
      if (url.toString().includes('/auth/refresh')) {
        refreshCalls += 1;
        return Promise.resolve(
          jsonResponse(200, { access_token: 'new-access', refresh_token: 'new-refresh', token_type: 'bearer' }),
        );
      }
      // Simplificação do mock: tanto a chamada original quanto a repetição pós-refresh
      // caem aqui e recebem 401 — o que importa neste teste é que só um refresh saiu.
      return Promise.resolve(jsonResponse(401, { detail: 'expired' }));
    });

    const [r1, r2] = await Promise.allSettled([apiClient.get('/accounts'), apiClient.get('/categories')]);

    expect(refreshCalls).toBe(1);
    expect(r1.status).toBe('rejected');
    expect(r2.status).toBe('rejected');
  });
});
