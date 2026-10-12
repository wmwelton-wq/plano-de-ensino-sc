// Tipos, normalização e utilidades do Plano de Ensino ANUAL.
// (Sem dependência de DOM nem de Supabase: roda no servidor e no navegador.)

import { MARCADOR_HTML } from "./texto-rico";

/** Um item de uma lista de marcar (ementa, habilidade, objeto, competência...). */
export interface ItemLista {
  /** Identificador estável: id do banco para itens oficiais, "manual:..." para os digitados. */
  id: string;
  texto: string;
  /** Código da habilidade (ex.: EM13CNT101) ou número da competência. */
  codigo?: string | null;
  /** "bncc" | "curriculo_catarinense" | "curriculo_educacao_digital" | "manual" */
  fonte?: string | null;
  manual?: boolean;
}

export interface TrimestreAnual {
  unidades: ItemLista[];
  habilidades: ItemLista[];
  objetos: ItemLista[];
}

export interface CompetenciasGeraisAnual {
  numeros: number[];
  manuais: string[];
}

export interface CompetenciasEspecificasAnual {
  bncc: ItemLista[];
  curriculo: ItemLista[];
  manuais: ItemLista[];
}

export interface DadosPlanoAnual {
  ementa: ItemLista[];
  competenciasGerais: CompetenciasGeraisAnual;
  competenciasEspecificas: CompetenciasEspecificasAnual;
  trimestres: TrimestreAnual[];
}

export type EtapaAnual = "fundamental_anos_iniciais" | "fundamental_anos_finais" | "ensino_medio";

export const ETAPAS_ANUAIS: { valor: EtapaAnual; rotulo: string; disciplinaEtapa: string }[] = [
  { valor: "fundamental_anos_iniciais", rotulo: "Ensino Fundamental — Anos Iniciais", disciplinaEtapa: "Ensino Fundamental - Anos Iniciais" },
  { valor: "fundamental_anos_finais", rotulo: "Ensino Fundamental — Anos Finais", disciplinaEtapa: "Ensino Fundamental - Anos Finais" },
  { valor: "ensino_medio", rotulo: "Ensino Médio", disciplinaEtapa: "Ensino Médio" },
];

export const TRIMESTRES_ROTULOS = ["1º TRIMESTRE", "2º TRIMESTRE", "3º TRIMESTRE"];

export interface PlanoAnual {
  id: string;
  professor_id: string;
  escola_id: string | null;
  disciplina_id: string | null;
  etapa: EtapaAnual;
  titulo: string;
  ano_letivo: number;
  componente: string | null;
  area: string | null;
  turma: string | null;
  turno: string | null;
  docente: string | null;
  formacao: string | null;
  incluir_logo_estado: boolean;
  incluir_logo_escola: boolean;
  ementa: unknown;
  competencias_gerais: unknown;
  competencias_especificas: unknown;
  trimestres: unknown;
  texto_livre: string | null;
  status: "rascunho" | "finalizado";
  created_at: string;
  updated_at: string;
}

const MAX_ITENS = 600;
const MAX_TEXTO = 4000;

function texto(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Valida/limpa uma lista vinda do navegador ou do banco. */
export function normalizarItens(v: unknown): ItemLista[] {
  if (!Array.isArray(v)) return [];
  const saida: ItemLista[] = [];
  for (const bruto of v.slice(0, MAX_ITENS)) {
    if (!bruto || typeof bruto !== "object") continue;
    const o = bruto as Record<string, unknown>;
    const t = texto(o.texto, MAX_TEXTO);
    if (!t) continue;
    const item: ItemLista = { id: texto(o.id, 80) || `manual:${saida.length}`, texto: t };
    const codigo = texto(o.codigo, 40);
    if (codigo) item.codigo = codigo;
    const fonte = texto(o.fonte, 40);
    if (fonte) item.fonte = fonte;
    if (o.manual === true) item.manual = true;
    saida.push(item);
  }
  return saida;
}

export function normalizarDados(bruto: {
  ementa?: unknown;
  competencias_gerais?: unknown;
  competencias_especificas?: unknown;
  trimestres?: unknown;
}): DadosPlanoAnual {
  const cg = (bruto.competencias_gerais ?? {}) as Record<string, unknown>;
  const ce = (bruto.competencias_especificas ?? {}) as Record<string, unknown>;
  const numeros = Array.isArray(cg.numeros)
    ? Array.from(new Set(cg.numeros.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 10))).sort((a, b) => a - b)
    : [];
  const manuais = Array.isArray(cg.manuais)
    ? cg.manuais.map((m) => texto(m, MAX_TEXTO)).filter(Boolean).slice(0, 50)
    : [];

  const trimestresBrutos = Array.isArray(bruto.trimestres) ? bruto.trimestres : [];
  const trimestres: TrimestreAnual[] = [0, 1, 2].map((i) => {
    const t = (trimestresBrutos[i] ?? {}) as Record<string, unknown>;
    return {
      unidades: normalizarItens(t.unidades),
      habilidades: normalizarItens(t.habilidades),
      objetos: normalizarItens(t.objetos),
    };
  });

  return {
    ementa: normalizarItens(bruto.ementa),
    competenciasGerais: { numeros, manuais },
    competenciasEspecificas: {
      bncc: normalizarItens(ce.bncc),
      curriculo: normalizarItens(ce.curriculo),
      manuais: normalizarItens(ce.manuais),
    },
    trimestres,
  };
}

export function dadosVazios(): DadosPlanoAnual {
  return normalizarDados({});
}

/** Primeiro número que aparece em "7º Ano", "1ª Série"... */
export function numeroDaSerie(serie: string | null | undefined): number | null {
  const m = /(\d{1,2})/.exec(serie ?? "");
  return m ? Number(m[1]) : null;
}

/**
 * "6º ano", "1º ao 5º ano", "1º e 2º anos" — vale para o ano `n`?
 * (Intervalo "X ao Y" inclui todos os anos entre X e Y.)
 */
export function anoCombina(anoSerie: string | null | undefined, n: number): boolean {
  const t = (anoSerie ?? "").toLowerCase();
  if (!t) return true;
  const intervalo = /(\d{1,2})\s*[º°ª]?\s*(?:ao|a|-|–)\s*(\d{1,2})/.exec(t);
  if (intervalo) {
    const a = Number(intervalo[1]);
    const b = Number(intervalo[2]);
    return n >= Math.min(a, b) && n <= Math.max(a, b);
  }
  const numeros = (t.match(/\d{1,2}/g) ?? []).map(Number);
  return numeros.length === 0 ? true : numeros.includes(n);
}

/** Quebra o texto "objeto de conhecimento" do banco em itens individuais. */
export function dividirObjetos(bruto: string | null | undefined): string[] {
  if (!bruto) return [];
  const itens: string[] = [];
  for (const parteBnc of bruto.split("|")) {
    // Currículo Catarinense: "Eixo: item A; item B; item C"
    const semEixo = parteBnc.includes(":") ? parteBnc.slice(parteBnc.indexOf(":") + 1) : parteBnc;
    for (const p of semEixo.split(";")) {
      const t = p.replace(/\s+/g, " ").trim().replace(/[.\s]+$/, "");
      if (t.length >= 3) itens.push(t);
    }
  }
  return itens;
}

/** Eixo/unidade ("Vida e evolução") que antecede os dois-pontos, quando existir. */
export function eixoDoObjeto(bruto: string | null | undefined): string | null {
  if (!bruto) return null;
  const primeiro = bruto.split("|")[0] ?? "";
  const i = primeiro.indexOf(":");
  if (i <= 0 || i > 80) return null;
  return primeiro.slice(0, i).replace(/\s+/g, " ").trim() || null;
}

/** Linhas "• item" do campo "conteúdos" do Currículo Catarinense. */
export function dividirConteudos(bruto: string | null | undefined): string[] {
  if (!bruto) return [];
  return bruto
    .split("\n")
    .map((l) => l.replace(/^[\s•\-–*]+/, "").replace(/\s+/g, " ").trim().replace(/[.\s]+$/, ""))
    .filter((l) => l.length >= 3);
}

export function chaveTexto(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Remove repetidos (ignorando acentos e maiúsculas), mantendo a ordem. */
export function semRepetidos<T extends { texto: string }>(itens: T[]): T[] {
  const vistos = new Set<string>();
  return itens.filter((i) => {
    const c = chaveTexto(i.texto);
    if (vistos.has(c)) return false;
    vistos.add(c);
    return true;
  });
}

/** Ementa em frase corrida (como no modelo): "Item A. Item B. Item C." */
export function ementaEmTexto(itens: ItemLista[]): string {
  return itens
    .map((i) => i.texto.trim())
    .filter(Boolean)
    .map((t) => (/[.!?]$/.test(t) ? t : `${t}.`))
    .join(" ");
}

const ORDEM_FONTE: Record<string, number> = {
  bncc: 0,
  curriculo_catarinense: 1,
  curriculo_educacao_digital: 2,
  manual: 3,
};

/** Habilidades na ordem BNCC → Currículo Catarinense → Educação Digital → digitadas à mão (estável). */
export function ordenarHabilidades(itens: ItemLista[]): ItemLista[] {
  return itens
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      const fa = ORDEM_FONTE[a.item.manual ? "manual" : a.item.fonte ?? "manual"] ?? 3;
      const fb = ORDEM_FONTE[b.item.manual ? "manual" : b.item.fonte ?? "manual"] ?? 3;
      return fa - fb || a.i - b.i;
    })
    .map((x) => x.item);
}

export const ROTULO_FONTE: Record<string, string> = {
  bncc: "BNCC",
  curriculo_catarinense: "Currículo Catarinense",
  curriculo_educacao_digital: "Currículo de Educação Digital",
  manual: "Digitada por você",
};

/** Referências oficiais sugeridas (botão do editor livre). */
export function referenciasSugeridas(etapa: string): string[] {
  const fundamental = etapa === "fundamental_anos_iniciais" || etapa === "fundamental_anos_finais";
  return [
    "BRASIL. Ministério da Educação. Base Nacional Comum Curricular. Brasília: MEC, 2018.",
    fundamental
      ? "SANTA CATARINA. Secretaria de Estado da Educação. Currículo Base da Educação Infantil e do Ensino Fundamental do Território Catarinense. Florianópolis: SED/SC, 2019."
      : "SANTA CATARINA. Secretaria de Estado da Educação. Currículo Base do Ensino Médio do Território Catarinense: Caderno 2 – Formação Geral Básica. Florianópolis: SED/SC, 2021.",
    "SANTA CATARINA. Secretaria de Estado da Educação. Portaria nº 3240, de 04 de novembro de 2025. Altera a Portaria nº 874/2025, que regulamenta os procedimentos e registros da Avaliação da Aprendizagem da Educação Básica e Profissional da Rede Pública Estadual de Santa Catarina. Florianópolis, SC: DOE nº 22635, 2025.",
    "SANTA CATARINA. Secretaria de Estado da Educação. Portaria nº 874, de 01 de abril de 2025. Regulamenta os procedimentos e registros da Avaliação da Aprendizagem da Educação Básica e Profissional da Rede Pública Estadual de Santa Catarina. Florianópolis, SC: DOE nº 22484, 2025.",
    "SANTA CATARINA. Secretaria de Estado da Educação. Currículo de Educação Digital da Rede Estadual de Santa Catarina. Florianópolis: SED/SC, 2026.",
    "BRASIL. Ministério da Educação. Temas Contemporâneos Transversais na BNCC: propostas de práticas de implementação. Brasília: MEC, 2019.",
    "Projeto Político-Pedagógico (PPP) da unidade escolar.",
  ];
}

/** Conteúdo inicial do campo livre (novo plano): só o início do item 6, para o professor continuar. */
export const TEXTO_LIVRE_INICIAL =
  MARCADOR_HTML + "<p>6. <b><u>Relação do componente curricular com outras áreas:</u></b> </p><p><br></p>";
