import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TwoFactorSettings from './TwoFactorSettings';
import { authApi } from '@/lib/api/auth-api';
import { ApiError } from '@/lib/api/api-client';

vi.mock('@/lib/api/auth-api', () => ({
  authApi: {
    setupTwoFactor: vi.fn(),
    verifyTwoFactor: vi.fn(),
    disableTwoFactor: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const fillOtp = (container: HTMLElement, code: string) => {
  const input = container.querySelector('input[data-input-otp]') as HTMLInputElement;
  fireEvent.change(input, { target: { value: code } });
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TwoFactorSettings', () => {
  it('estado inicial oferece ativar o 2FA', () => {
    render(<TwoFactorSettings />);
    expect(screen.getByRole('button', { name: /ativar 2fa/i })).toBeInTheDocument();
  });

  it('fluxo completo: ativar com QR/código e depois desativar com senha', async () => {
    vi.mocked(authApi.setupTwoFactor).mockResolvedValue({
      secret: 'JBSWY3DPEHPK3PXP',
      provisioning_uri: 'otpauth://totp/GeraFinance:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GeraFinance',
    });
    vi.mocked(authApi.verifyTwoFactor).mockResolvedValue(undefined);
    vi.mocked(authApi.disableTwoFactor).mockResolvedValue(undefined);

    const { container } = render(<TwoFactorSettings />);

    fireEvent.click(screen.getByRole('button', { name: /ativar 2fa/i }));
    await waitFor(() => expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument());

    fillOtp(container, '123456');
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => expect(authApi.verifyTwoFactor).toHaveBeenCalledWith('123456'));
    await waitFor(() => expect(screen.getByRole('button', { name: /desativar 2fa/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /desativar 2fa/i }));
    fireEvent.change(screen.getByLabelText(/senha atual/i), { target: { value: 'minhasenha123' } });
    fireEvent.click(screen.getByRole('button', { name: /^desativar$/i }));

    await waitFor(() =>
      expect(authApi.disableTwoFactor).toHaveBeenCalledWith({ password: 'minhasenha123', code: undefined }),
    );
    await waitFor(() => expect(screen.getByRole('button', { name: /ativar 2fa/i })).toBeInTheDocument());
  });

  it('setup retornando 409 assume que o 2FA já está ativo, sem passar pela etapa de QR code', async () => {
    vi.mocked(authApi.setupTwoFactor).mockRejectedValue(new ApiError(409, '2FA já está ativo'));

    render(<TwoFactorSettings />);
    fireEvent.click(screen.getByRole('button', { name: /ativar 2fa/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /desativar 2fa/i })).toBeInTheDocument());
  });

  it('código de verificação inválido mostra erro e mantém a etapa de setup', async () => {
    vi.mocked(authApi.setupTwoFactor).mockResolvedValue({
      secret: 'SECRET123',
      provisioning_uri: 'otpauth://totp/x',
    });
    vi.mocked(authApi.verifyTwoFactor).mockRejectedValue(new ApiError(400, 'Código inválido'));

    const { container } = render(<TwoFactorSettings />);
    fireEvent.click(screen.getByRole('button', { name: /ativar 2fa/i }));
    await waitFor(() => expect(screen.getByText('SECRET123')).toBeInTheDocument());

    fillOtp(container, '000000');
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => expect(screen.getByText('Código inválido')).toBeInTheDocument());
    expect(screen.getByText('SECRET123')).toBeInTheDocument();
  });

  it('desativação com senha incorreta mostra erro e mantém a etapa de desativação', async () => {
    vi.mocked(authApi.setupTwoFactor).mockRejectedValue(new ApiError(409, '2FA já está ativo'));
    vi.mocked(authApi.disableTwoFactor).mockRejectedValue(new ApiError(401, 'Senha ou código TOTP inválidos'));

    render(<TwoFactorSettings />);
    fireEvent.click(screen.getByRole('button', { name: /ativar 2fa/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /desativar 2fa/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /desativar 2fa/i }));
    fireEvent.change(screen.getByLabelText(/senha atual/i), { target: { value: 'senha-errada' } });
    fireEvent.click(screen.getByRole('button', { name: /^desativar$/i }));

    await waitFor(() => expect(screen.getByText('Senha ou código TOTP inválidos')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /^desativar$/i })).toBeInTheDocument();
  });
});
