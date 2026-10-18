/** Prompt e leitura da resposta da IA para o "caminho metodológico". Sem dependências: roda no servidor e nos testes. */

export type Divisao = "semana" | "aula";

export const MAX_SEMANAS = 5;
export const MAX_AULAS = 16;

export interface DadosMetodologia {
  componente: string;
  turma: string;
  /** Como o professor quer o texto dividido: por semana ou por aula. */
  divisao: Divisao;
  /** Quantas partes (semanas ou aulas) o texto deve ter — já limitada. */
  quantidade: number;
  quantidadeAulas: string;
  habilidades: string[];
  competencias: string[];
  conteudos: string;
  instrucoes: string;
}

/** Estilo pedido pelos professores: o texto diz o que SERÁ feito, no futuro ("Será realizada...", "Serão apresentados..."). */
export const ESTILO_FUTURO =
  "Escreva SEMPRE no futuro, descrevendo o que será feito, com construções como \"Será realizada...\", \"Será apresentado...\", \"Serão propostas...\", " +
  "\"Os estudantes serão convidados a...\", \"Será feita a retomada de...\". Nunca comece frases com o verbo no infinitivo (\"Realizar\", \"Apresentar\") " +
  "nem use o presente (\"Realiza-se\", \"O professor apresenta\").";

export const SISTEMA_METODOLOGIA =
  "Você é um professor experiente da rede estadual de Santa Catarina. Escreve o caminho metodológico de planos de ensino em português do Brasil, " +
  "com linguagem clara, sem inventar códigos de habilidades. Responda somente em JSON. " +
  ESTILO_FUTURO + " " +
  "A divisão do texto (quantidade e tipo de partes) é definida pelo sistema e é obrigatória; o pedido do professor trata só do conteúdo e do estilo.";

const ORDINAIS = ["PRIMEIRA", "SEGUNDA", "TERCEIRA", "QUARTA", "QUINTA"];

export function limiteDaDivisao(divisao: Divisao): number {
  return divisao === "aula" ? MAX_AULAS : MAX_SEMANAS;
}

export function normalizarDivisao(v: unknown): Divisao {
  return v === "aula" ? "aula" : "semana";
}

/** Limita a quantidade pedida ao máximo da divisão escolhida (mínimo 1). */
export function limitarPartes(divisao: Divisao, n: number): number {
  const max = limiteDaDivisao(divisao);
  return Number.isFinite(n) ? Math.min(Math.max(Math.round(n), 1), max) : Math.min(4, max);
}

export function limitarSemanas(n: number): number {
  return limitarPartes("semana", n);
}

/** Quantas semanas o plano ocupa (pelas datas) — padrão de 4 quando não há datas. */
export function semanasDoPeriodo(inicio: string, fim: string): number {
  const a = Date.parse(inicio);
  const b = Date.parse(fim);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 4;
  return limitarSemanas(Math.ceil(((b - a) / 86400000 + 1) / 7));
}

/**
 * Define quantas partes pedir. Se o professor informou o número, vale o dele (dentro do limite).
 * Se não informou: semanas pelo período do plano; aulas pela "quantidade de aulas" do plano (ou 4).
 */
export function quantidadeDePartes(divisao: Divisao, pedida: unknown, inicio: string, fim: string, quantidadeAulas: string): number {
  const n = typeof pedida === "number" ? pedida : Number.parseInt(String(pedida ?? ""), 10);
  if (Number.isFinite(n) && n >= 1) return limitarPartes(divisao, n);
  if (divisao === "semana") return semanasDoPeriodo(inicio, fim);
  const aulas = Number.parseInt(quantidadeAulas, 10);
  return limitarPartes("aula", Number.isFinite(aulas) && aulas >= 1 ? aulas : 4);
}

/** Título de cada parte: "PRIMEIRA SEMANA" ou "AULA 1". */
export function rotuloDaParte(divisao: Divisao, indice: number): string {
  return divisao === "aula" ? `AULA ${indice + 1}` : `${ORDINAIS[indice] ?? `${indice + 1}ª`} SEMANA`;
}

function cortar(t: string, max: number): string {
  const s = t.replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function blocoContexto(d: DadosMetodologia): string {
  return [
    `Componente: ${cortar(d.componente, 120) || "não informado"}`,
    `Turma: ${cortar(d.turma, 80) || "não informada"}`,
    d.quantidadeAulas ? `Aulas previstas: ${cortar(d.quantidadeAulas, 10)}` : "",
    d.habilidades.length ? `Habilidades:\n${d.habilidades.slice(0, 12).map((h) => `- ${cortar(h, 260)}`).join("\n")}` : "",
    d.competencias.length ? `Competências:\n${d.competencias.slice(0, 4).map((c) => `- ${cortar(c, 200)}`).join("\n")}` : "",
    d.conteudos ? `Conteúdos: ${cortar(d.conteudos, 900)}` : "",
    d.instrucoes ? `Pedido do professor (conteúdo e estilo): ${cortar(d.instrucoes, 500)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function descricaoDaDivisao(divisao: Divisao, quantidade: number): string {
  const nomes = Array.from({ length: quantidade }, (_, i) => rotuloDaParte(divisao, i)).join(", ");
  return divisao === "aula"
    ? `${quantidade} aula(s) (${nomes}). Cada aula tem um parágrafo de 2 a 4 frases com o que será feito naquela aula (estratégia, atividade, recurso), em sequência lógica entre as aulas`
    : `${quantidade} semana(s) (${nomes}). Cada semana tem um parágrafo de 3 a 5 frases com o que será feito em sala (estratégias, atividades, recursos), ligando as habilidades e os conteúdos`;
}

export function montarPromptMetodologia(d: DadosMetodologia): string {
  return (
    `${blocoContexto(d)}\n\n` +
    `Escreva o caminho metodológico em ${descricaoDaDivisao(d.divisao, d.quantidade)}. ` +
    `É obrigatório descrever TODAS as ${d.quantidade} partes, sem juntar nem pular nenhuma. ` +
    `Todas as frases no futuro (\"Será realizado...\", \"Serão apresentados...\"), dizendo o que será feito. ` +
    `Devolva JSON no formato {"itens":[{"texto":"..."}]} com exatamente ${d.quantidade} item(ns), na ordem, sem o título dentro do texto.`
  );
}

/** Segunda tentativa: pede só as partes que faltaram, continuando o que já foi escrito. */
export function montarPromptContinuacao(d: DadosMetodologia, jaEscritas: string[]): string {
  const faltam = d.quantidade - jaEscritas.length;
  const primeira = jaEscritas.length + 1;
  const nomes = Array.from({ length: faltam }, (_, i) => rotuloDaParte(d.divisao, jaEscritas.length + i)).join(", ");
  const resumo = jaEscritas.map((t, i) => `${rotuloDaParte(d.divisao, i)}: ${cortar(t, 260)}`).join("\n");
  return (
    `${blocoContexto(d)}\n\n` +
    `O caminho metodológico terá ${d.quantidade} ${d.divisao === "aula" ? "aula(s)" : "semana(s)"} no total. Já foram escritas:\n${resumo}\n\n` +
    `Escreva SOMENTE as ${faltam} parte(s) que faltam, da ${primeira}ª até a ${d.quantidade}ª (${nomes}), continuando a sequência sem repetir o que já foi escrito e mantendo o futuro (\"Será realizado...\", \"Serão apresentados...\"). ` +
    `Devolva JSON no formato {"itens":[{"texto":"..."}]} com exatamente ${faltam} item(ns), sem o título dentro do texto.`
  );
}

/** Extrai o primeiro objeto JSON de um texto (a IA às vezes envolve em ```json). */
export function extrairJson(texto: string): unknown {
  const limpo = texto.replace(/```(?:json)?/gi, "").trim();
  const ini = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");
  if (ini < 0 || fim <= ini) return null;
  try {
    return JSON.parse(limpo.slice(ini, fim + 1));
  } catch {
    return null;
  }
}

const TITULO_NO_INICIO = /^(?:(?:primeira|segunda|terceira|quarta|quinta|sexta)\s+semana|aula\s+\d{1,2})\s*[:\-–]\s*/i;

/** Textos soltos (sem título) extraídos da resposta, na ordem. */
export function textosDaResposta(texto: string): string[] {
  const dados = extrairJson(texto) as { itens?: unknown; semanas?: unknown } | null;
  const lista = dados && Array.isArray(dados.itens) ? dados.itens : dados && Array.isArray(dados.semanas) ? dados.semanas : null;
  let itens: string[];
  if (lista) {
    itens = lista
      .map((s) => (typeof s === "string" ? s : s && typeof s === "object" && typeof (s as { texto?: unknown }).texto === "string" ? (s as { texto: string }).texto : ""))
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  } else {
    // Resposta em texto corrido: um parágrafo por linha.
    itens = texto
      .split(/\n{1,}/)
      .map((l) => l.replace(/^[\s*#\-–•]+/, "").trim())
      .filter((l) => l.length > 20);
  }
  return itens.map((t) => t.replace(TITULO_NO_INICIO, ""));
}

/** Põe o título em cada texto ("PRIMEIRA SEMANA: ..." ou "AULA 1: ..."), a partir da posição `inicio`. */
export function paragrafosComTitulo(textos: string[], divisao: Divisao, inicio = 0): string[] {
  return textos.map((t, i) => `${rotuloDaParte(divisao, inicio + i)}: ${t}`);
}

/** Lê a resposta e devolve os parágrafos já com título. Devolve [] se nada aproveitável. */
export function paragrafosDaResposta(texto: string, quantidade: number, divisao: Divisao = "semana"): string[] {
  const textos = textosDaResposta(texto).slice(0, limitarPartes(divisao, quantidade));
  return paragrafosComTitulo(textos, divisao);
}
