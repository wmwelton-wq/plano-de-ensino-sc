/**
 * Chama a rota interna /api/turnstile-verify, que valida o token do
 * Turnstile no servidor com a chave secreta. Nunca fazemos essa validação
 * diretamente no navegador.
 */
export async function verificarTurnstile(token: string): Promise<boolean> {
  try {
    const res = await fetch("/api/turnstile-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
