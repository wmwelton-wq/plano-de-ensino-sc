// Utilidades para gerar planos MENSAIS a partir de um plano ANUAL (sem DOM, sem Supabase).

export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Meses sugeridos para cada trimestre (o professor pode mudar). */
export const MESES_SUGERIDOS: number[][] = [
  [2, 3, 4],
  [5, 6, 7],
  [8, 9, 10, 11],
];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const ehUuid = (v: string) => UUID.test(v);

const dois = (n: number) => String(n).padStart(2, "0");

/** Primeiro e último dia do mês (AAAA-MM-DD). mes: 1 a 12. */
export function periodoDoMes(ano: number, mes: number): { inicio: string; fim: string } {
  const ultimo = new Date(ano, mes, 0).getDate();
  return { inicio: `${ano}-${dois(mes)}-01`, fim: `${ano}-${dois(mes)}-${dois(ultimo)}` };
}

/** Reparte uma lista em `partes` pedaços de tamanho parecido, mantendo a ordem. */
export function repartir<T>(itens: T[], partes: number): T[][] {
  if (partes <= 1) return [itens];
  const saida: T[][] = Array.from({ length: partes }, () => []);
  const base = Math.floor(itens.length / partes);
  const resto = itens.length % partes;
  let i = 0;
  for (let p = 0; p < partes; p++) {
    const qtd = base + (p < resto ? 1 : 0);
    saida[p] = itens.slice(i, i + qtd);
    i += qtd;
  }
  return saida;
}

function escapar(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Lista de objetos de conhecimento em parágrafos (HTML simples, com o marcador do editor). */
export function conteudosEmHtml(textos: string[], marcador: string): string | null {
  const limpos = textos.map((t) => t.trim()).filter(Boolean);
  if (limpos.length === 0) return null;
  return marcador + limpos.map((t) => `<p>${escapar(t)}</p>`).join("");
}
