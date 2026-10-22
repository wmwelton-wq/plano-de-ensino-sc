/**
 * Caminho de retorno ("voltar") passado por parâmetro de endereço entre telas do painel.
 * Só aceita caminhos internos que começam em /dashboard (nunca endereços externos), para não
 * virar redirecionamento aberto.
 */
const CAMINHO_SEGURO = /^\/dashboard(?:\/[\w.~%-]+)*\/?(?:\?[\w.~%=&+,-]*)?$/;

export function voltarSeguro(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const v = valor.trim();
  if (v.length === 0 || v.length > 300 || v.includes("..")) return null;
  return CAMINHO_SEGURO.test(v) ? v : null;
}

/** Texto do botão "Voltar" conforme a tela de origem. */
export function rotuloVoltar(caminho: string): string {
  const base = caminho.split("?")[0].replace(/\/$/, "");
  if (base === "/dashboard") return "Voltar ao início";
  if (base.startsWith("/dashboard/planos")) return "Voltar ao plano";
  if (base.startsWith("/dashboard/anual")) return "Voltar ao plano anual";
  if (base.startsWith("/dashboard/calendario")) return "Voltar ao calendário";
  if (base.startsWith("/dashboard/ajuda")) return "Voltar à ajuda";
  return "Voltar";
}
