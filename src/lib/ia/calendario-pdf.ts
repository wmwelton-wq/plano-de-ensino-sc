/** Prompt e validação da leitura de calendário escolar em PDF. Tudo que a IA devolve é conferido aqui antes de ir ao professor. */
import { SEM_AULA_PADRAO, type TipoEvento } from "@/lib/feriados";
import { extrairJson } from "./metodologia";

export const LIMITE_PAGINAS_PDF = 4;
export const LIMITE_BYTES_PDF = 4 * 1024 * 1024;

export const SISTEMA_CALENDARIO =
  "Você lê calendários escolares brasileiros em PDF e devolve somente JSON válido. Não invente datas: use apenas o que está escrito no documento.";

export function promptCalendario(anoSugerido: number): string {
  return (
    `Leia o calendário escolar anexo (ano letivo provável: ${anoSugerido}). Liste cada feriado, recesso, período sem aula, evento, reunião, avaliação, ` +
    `conselho de classe, início/fim de bimestre ou trimestre e data comemorativa da escola. ` +
    `Devolva JSON no formato {"eventos":[{"titulo":"...","data_inicio":"AAAA-MM-DD","data_fim":"AAAA-MM-DD","tipo":"feriado|recesso|evento|projeto|prova|reuniao|outro","sem_aula":true|false}]}. ` +
    `Use data_fim igual a data_inicio para um único dia. Marque sem_aula=true somente se o documento indicar que não há aula. ` +
    `Ignore sábados e domingos soltos. Máximo de 150 itens.`
  );
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const TIPOS = Object.keys(SEM_AULA_PADRAO) as TipoEvento[];

function dataValida(v: unknown): v is string {
  if (typeof v !== "string" || !DATA.test(v)) return false;
  const [a, m, d] = v.split("-").map(Number);
  const t = new Date(Date.UTC(a, m - 1, d));
  return t.getUTCFullYear() === a && t.getUTCMonth() === m - 1 && t.getUTCDate() === d && a >= 2000 && a <= 2100;
}

export interface EventoLido {
  titulo: string;
  tipo: TipoEvento;
  sem_aula: boolean;
  data_inicio: string;
  data_fim: string;
}

/** Aceita só itens válidos, remove repetidos e limita a 150. */
export function eventosDaResposta(texto: string): EventoLido[] {
  const dados = extrairJson(texto) as { eventos?: unknown } | null;
  if (!dados || !Array.isArray(dados.eventos)) return [];
  const vistos = new Set<string>();
  const saida: EventoLido[] = [];
  for (const bruto of dados.eventos) {
    if (!bruto || typeof bruto !== "object") continue;
    const e = bruto as Record<string, unknown>;
    const titulo = typeof e.titulo === "string" ? e.titulo.replace(/\s+/g, " ").trim().slice(0, 120) : "";
    if (!titulo || !dataValida(e.data_inicio)) continue;
    const inicio = e.data_inicio;
    const fim = dataValida(e.data_fim) && e.data_fim >= inicio ? e.data_fim : inicio;
    if ((Date.parse(fim) - Date.parse(inicio)) / 86400000 > 400) continue;
    const tipo: TipoEvento = TIPOS.includes(e.tipo as TipoEvento) ? (e.tipo as TipoEvento) : "outro";
    const sem_aula = typeof e.sem_aula === "boolean" ? e.sem_aula : SEM_AULA_PADRAO[tipo];
    const chave = `${titulo.toLowerCase()}|${inicio}|${fim}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    saida.push({ titulo, tipo, sem_aula, data_inicio: inicio, data_fim: fim });
    if (saida.length >= 150) break;
  }
  return saida.sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
}

/**
 * Conta as páginas de um PDF sem biblioteca: procura objetos /Type /Page (não /Pages) e o /Count da árvore de páginas.
 * Devolve null se não conseguir (PDF comprimido em fluxos de objetos) — nesse caso o limite de tamanho protege o gasto.
 */
export function contarPaginasPdf(bytes: Uint8Array): number | null {
  const texto = new TextDecoder("latin1").decode(bytes);
  if (!texto.startsWith("%PDF")) return null;
  const paginas = texto.match(/\/Type\s*\/Page(?![s\w])/g)?.length ?? 0;
  const contagens = [...texto.matchAll(/\/Type\s*\/Pages[^>]*?\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
  const contagens2 = [...texto.matchAll(/\/Count\s+(\d+)[^>]*?\/Type\s*\/Pages/g)].map((m) => Number(m[1]));
  const maxCount = Math.max(0, ...contagens, ...contagens2);
  const n = Math.max(paginas, maxCount);
  return n > 0 ? n : null;
}
