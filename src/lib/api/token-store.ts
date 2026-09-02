import { TokenPair } from './types';

// O access_token vive só em memória (nunca em localStorage/sessionStorage): ele já tem
// vida curta e mantê-lo fora de qualquer storage reduz o que um XSS conseguiria roubar.
// O refresh_token precisa sobreviver a um F5, então vai para o localStorage — o trade-off
// aceito aqui é que ele fica exposto a XSS; o ideal em produção seria um cookie httpOnly,
// o que exigiria o backend setar/ler o cookie (fora do escopo deste front).
const REFRESH_TOKEN_KEY = 'gerfinance_refresh_token';

type Listener = () => void;

let accessToken: string | null = null;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((listener) => listener());

export const tokenStore = {
  getAccessToken: (): string | null => accessToken,

  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),

  setTokens: (pair: TokenPair): void => {
    accessToken = pair.access_token;
    localStorage.setItem(REFRESH_TOKEN_KEY, pair.refresh_token);
    emit();
  },

  clear: (): void => {
    accessToken = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    emit();
  },

  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
