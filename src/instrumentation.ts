/**
 * Registra no log da Vercel (Runtime Logs) todo erro inesperado do servidor, em formato estruturado,
 * para o problema aparecer antes de o professor reclamar. Não envia nenhum dado para fora.
 */
export function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string; routeType: string }
) {
  const e = error as { message?: string; digest?: string; stack?: string } | undefined;
  console.error(
    JSON.stringify({
      nivel: "erro",
      mensagem: e?.message ?? String(error),
      digest: e?.digest,
      rota: context.routePath,
      tipo: context.routeType,
      metodo: request.method,
      caminho: request.path,
      quando: new Date().toISOString(),
    })
  );
}
