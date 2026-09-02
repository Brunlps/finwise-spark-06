// Lê o claim "sub" (id do usuário) do payload de um JWT sem verificar assinatura — o
// token já veio de uma chamada HTTPS ao backend, isso é só para popular a UI (nome/id
// exibidos), nunca usado para decidir permissões.
export const decodeUserId = (accessToken: string): string | null => {
  try {
    const payload = accessToken.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    const claims = JSON.parse(json) as { sub?: string };
    return claims.sub ?? null;
  } catch {
    return null;
  }
};
