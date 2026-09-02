import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { QRCodeSVG } from 'qrcode.react';
import { authApi } from '@/lib/api/auth-api';
import { ApiError } from '@/lib/api/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// O UserRead do backend não expõe se o 2FA está ativo (a única fonte de verdade é a
// coluna totp_secret, que nunca sai da API) — então esse estado é só desta sessão do
// navegador: começa em "não sei" e é inferido pela primeira interação (setup/disable), ou
// por um 409 de "já está ativo"/"não está ativo" quando o usuário tenta a ação errada. Um
// F5 volta ao estado inicial. Documentado no resumo da sessão.
type Phase = 'idle' | 'setup' | 'disable';

const verifySchema = z.object({ code: z.string().length(6, 'O código tem 6 dígitos') });
type VerifyValues = z.infer<typeof verifySchema>;

const disableSchema = z
  .object({ password: z.string().optional(), code: z.string().optional() })
  .refine((data) => !!data.password || !!data.code?.trim(), {
    message: 'Informe sua senha ou um código do app autenticador',
    path: ['password'],
  });
type DisableValues = z.infer<typeof disableSchema>;

const describeError = (error: unknown, fallback: string): string =>
  error instanceof ApiError ? error.detail : fallback;

const TwoFactorSettings = () => {
  const [enabled, setEnabled] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [provisioningUri, setProvisioningUri] = useState<string | null>(null);

  const verifyForm = useForm<VerifyValues>({ resolver: zodResolver(verifySchema), defaultValues: { code: '' } });
  const disableForm = useForm<DisableValues>({
    resolver: zodResolver(disableSchema),
    defaultValues: { password: '', code: '' },
  });

  const backToIdle = () => {
    setPhase('idle');
    setServerError(null);
    verifyForm.reset();
    disableForm.reset();
  };

  const startSetup = async () => {
    setServerError(null);
    setLoading(true);
    try {
      const { secret: newSecret, provisioning_uri } = await authApi.setupTwoFactor();
      setSecret(newSecret);
      setProvisioningUri(provisioning_uri);
      setPhase('setup');
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setEnabled(true);
        toast.info('O 2FA já está ativo nesta conta.');
      } else {
        setServerError(describeError(error, 'Não foi possível iniciar a configuração do 2FA.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmSetup = async (values: VerifyValues) => {
    setServerError(null);
    setLoading(true);
    try {
      await authApi.verifyTwoFactor(values.code);
      setEnabled(true);
      toast.success('2FA ativado com sucesso!');
      backToIdle();
    } catch (error) {
      setServerError(describeError(error, 'Código inválido ou expirado.'));
    } finally {
      setLoading(false);
    }
  };

  const startDisable = () => {
    setServerError(null);
    setPhase('disable');
  };

  const confirmDisable = async (values: DisableValues) => {
    setServerError(null);
    setLoading(true);
    try {
      await authApi.disableTwoFactor({
        password: values.password || undefined,
        code: values.code || undefined,
      });
      setEnabled(false);
      toast.success('2FA desativado.');
      backToIdle();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setEnabled(false);
        toast.info('O 2FA já estava desativado.');
        backToIdle();
      } else {
        setServerError(describeError(error, 'Senha ou código inválidos.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {enabled ? <ShieldCheck className="h-5 w-5 text-income" /> : <ShieldOff className="h-5 w-5 text-muted-foreground" />}
          Verificação em duas etapas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {phase === 'idle' && (
          <>
            <p className="text-sm text-muted-foreground">
              {enabled
                ? 'O 2FA está ativo. Um código do seu app autenticador será exigido a cada login.'
                : 'Adicione uma camada extra de segurança exigindo um código do seu app autenticador a cada login.'}
            </p>
            {enabled ? (
              <Button variant="outline" onClick={startDisable} disabled={loading}>
                Desativar 2FA
              </Button>
            ) : (
              <Button onClick={startSetup} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ativar 2FA
              </Button>
            )}
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
          </>
        )}

        {phase === 'setup' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escaneie o QR code com seu app autenticador (Google Authenticator, Authy, etc.) ou digite o código manualmente.
            </p>
            {provisioningUri && (
              <div className="flex justify-center rounded-lg border border-border p-4 bg-white w-fit mx-auto">
                <QRCodeSVG value={provisioningUri} size={180} />
              </div>
            )}
            {secret && (
              <p className="text-center text-sm font-mono tracking-wider select-all break-all">{secret}</p>
            )}
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
            <Form {...verifyForm}>
              <form onSubmit={verifyForm.handleSubmit(confirmSetup)} className="space-y-4">
                <FormField
                  control={verifyForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                      <FormLabel className="self-start">Código de verificação</FormLabel>
                      <FormControl>
                        <InputOTP maxLength={6} value={field.value} onChange={field.onChange}>
                          <InputOTPGroup>
                            {Array.from({ length: 6 }).map((_, i) => (
                              <InputOTPSlot key={i} index={i} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={backToIdle} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {phase === 'disable' && (
          <Form {...disableForm}>
            <form onSubmit={disableForm.handleSubmit(confirmDisable)} className="space-y-4">
              <p className="text-sm text-muted-foreground">Confirme sua senha ou um código do app autenticador para desativar o 2FA.</p>
              {serverError && (
                <Alert variant="destructive">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={disableForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha atual</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={disableForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ou código do app autenticador</FormLabel>
                    <FormControl>
                      <Input placeholder="000000" maxLength={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={backToIdle} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Desativar
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorSettings;
