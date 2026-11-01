/**
 * Ano de competência: o professor escolhe o ano ao entrar e tudo o que vê (planos, calendário, listas) fica daquele ano.
 * Este arquivo só tem funções simples (usadas também pelo proxy); a leitura do cookie no servidor está em ano-competencia-servidor.ts.
 */

export const COOKIE_ANO = "ano_competencia";
export const ROTA_ESCOLHA_ANO = "/dashboard/ano";

/** Aceita só anos de 4 dígitos entre 2000 e 2100; qualquer outra coisa vira null. */
export function lerAno(valor: string | null | undefined): number | null {
  if (!valor || !/^\d{4}$/.test(valor)) return null;
  const n = Number(valor);
  return n >= 2000 && n <= 2100 ? n : null;
}

/** Anos oferecidos na lista: dois antes e dois depois do ano atual (dá para preparar o ano que vem). */
export function anosParaEscolha(base: number = new Date().getFullYear()): number[] {
  return [base - 2, base - 1, base, base + 1, base + 2];
}

/** A própria tela de escolha (cuidado: "/dashboard/anual" NÃO é ela). */
export function ehRotaDeEscolha(caminho: string): boolean {
  return caminho === ROTA_ESCOLHA_ANO || caminho.startsWith(`${ROTA_ESCOLHA_ANO}/`) || caminho.startsWith(`${ROTA_ESCOLHA_ANO}?`);
}

/** Só endereços do próprio painel (evita redirecionar para fora do site). */
export function destinoSeguro(destino: string | null | undefined): string {
  const d = (destino ?? "").trim();
  if (d.startsWith("/dashboard") && !d.startsWith("//") && !d.includes("\\") && !/[\r\n]/.test(d) && !ehRotaDeEscolha(d)) return d;
  return "/dashboard";
}
