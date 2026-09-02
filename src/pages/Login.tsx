import { Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { DollarSign, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/api-client';

type Mode = 'login' | 'register';

const credentialsSchema = z.object({
  email: z.string().trim().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const registerSchema = z.object({
  email: z.string().trim().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'A senha precisa ter ao menos 8 caracteres')
    .max(128, 'A senha pode ter no máximo 128 caracteres'),
});

const twoFactorSchema = z.object({
  code: z.string().length(6, 'O código tem 6 dígitos'),
});

type CredentialsValues = z.infer<typeof credentialsSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type TwoFactorValues = z.infer<typeof twoFactorSchema>;

// Mensagens amigáveis para os status que a API costuma devolver nessas rotas.
const describeAuthError = (error: unknown, context: 'login' | 'register' | '2fa'): string => {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'Muitas tentativas. Aguarde um minuto e tente novamente.';
    if (error.status === 401 && context === 'login') return 'E-mail ou senha inválidos.';
    if (error.status === 401 && context === '2fa') return 'Código inválido ou expirado. Tente novamente.';
    if (error.status === 409 && context === 'register') return 'Já existe uma conta com esse e-mail.';
    return error.detail;
  }
  return 'Não foi possível conectar ao servidor. Tente novamente.';
};

const Login = () => {
  const { login, register: registerUser, confirmTwoFactor, cancelTwoFactor, twoFactorPending } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const loginForm = useForm<CredentialsValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '' },
  });

  const twoFactorForm = useForm<TwoFactorValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: '' },
  });

  const handleLogin = async (values: CredentialsValues) => {
    setServerError(null);
    setLoading(true);
    try {
      const { twoFactorRequired } = await login(values.email, values.password);
      if (twoFactorRequired) {
        toast.info('Digite o código do seu app autenticador');
      } else {
        toast.success('Login realizado com sucesso!');
        navigate('/');
      }
    } catch (error) {
      setServerError(describeAuthError(error, 'login'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterValues) => {
    setServerError(null);
    setLoading(true);
    try {
      await registerUser(values.email, values.password);
      toast.success('Cadastro realizado! Faça login para continuar.');
      loginForm.setValue('email', values.email);
      registerForm.reset();
      setMode('login');
    } catch (error) {
      setServerError(describeAuthError(error, 'register'));
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactor = async (values: TwoFactorValues) => {
    setServerError(null);
    setLoading(true);
    try {
      await confirmTwoFactor(values.code);
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error) {
      setServerError(describeAuthError(error, '2fa'));
    } finally {
      setLoading(false);
    }
  };

  const handleBackFromTwoFactor = () => {
    cancelTwoFactor();
    twoFactorForm.reset();
    setServerError(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setServerError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <DollarSign className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">GerFinance</h1>
        </div>

        <Card className="shadow-lg border-border/50">
          {twoFactorPending ? (
            <Fragment key="2fa">
              <CardHeader className="text-center pb-2">
                <div className="flex items-center justify-center gap-2 text-xl font-semibold">
                  <ShieldCheck className="h-5 w-5" />
                  Verificação em duas etapas
                </div>
                <p className="text-sm text-muted-foreground">Digite o código de 6 dígitos do seu app autenticador</p>
              </CardHeader>
              <CardContent>
                {serverError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                )}
                <Form {...twoFactorForm}>
                  <form onSubmit={twoFactorForm.handleSubmit(handleTwoFactor)} className="space-y-4">
                    <FormField
                      control={twoFactorForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-center">
                          <FormLabel className="self-start">Código</FormLabel>
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
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirmar
                    </Button>
                    <Button type="button" variant="ghost" className="w-full" onClick={handleBackFromTwoFactor}>
                      Voltar
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Fragment>
          ) : mode === 'login' ? (
            <Fragment key="login">
              <CardHeader className="text-center pb-2">
                <h2 className="text-xl font-semibold">Entrar na sua conta</h2>
                <p className="text-sm text-muted-foreground">Use seu e-mail e senha cadastrados</p>
              </CardHeader>
              <CardContent>
                {serverError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                )}
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Entrar
                    </Button>
                  </form>
                </Form>
                <p className="text-sm text-center text-muted-foreground mt-4">
                  Não tem conta?{' '}
                  <button type="button" className="text-primary font-medium hover:underline" onClick={() => switchMode('register')}>
                    Cadastre-se
                  </button>
                </p>
              </CardContent>
            </Fragment>
          ) : (
            <Fragment key="register">
              <CardHeader className="text-center pb-2">
                <h2 className="text-xl font-semibold">Criar sua conta</h2>
                <p className="text-sm text-muted-foreground">Senha com no mínimo 8 caracteres</p>
              </CardHeader>
              <CardContent>
                {serverError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                )}
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Cadastrar
                    </Button>
                  </form>
                </Form>
                <p className="text-sm text-center text-muted-foreground mt-4">
                  Já tem conta?{' '}
                  <button type="button" className="text-primary font-medium hover:underline" onClick={() => switchMode('login')}>
                    Entrar
                  </button>
                </p>
              </CardContent>
            </Fragment>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Login;
