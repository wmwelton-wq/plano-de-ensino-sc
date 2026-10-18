/** Prompt e leitura da resposta da IA para o "caminho metodológico". Sem dependências: roda no servidor e nos testes. */

export interface DadosMetodologia {
  componente: string;
  turma: string;
  semanas: number;
  quantidadeAulas: string;
  habilidades: string[];
  competencias: string[];
  conteudos: string;
  instrucoes: string;
}

export const SISTEMA_METODOLOGIA =
  "Você é um professor experiente da rede estadual de Santa Catarina. Escreve o caminho metodológico de planos de ensino em português do Brasil, " +
  "com linguagem clara, verbos no infinitivo ou no presente, sem inventar códigos de habilidades. Responda somente em JSON.";

const ORDINAIS = ["PRIMEIRA", "SEGUNDA", "TERCEIRA", "QUARTA", "QUINTA", "SEXTA"];

export function limitarSemanas(n: number): number {
  return Number.isFinite(n) ? Math.min(Math.max(Math.round(n), 1), ORDINAIS.length) : 4;
}

/** Quantas semanas o plano ocupa (pelas datas) — padrão de 4 quando não há datas. */
export function semanasDoPeriodo(inicio: string, fim: string): number {
  const a = Date.parse(inicio);
  const b = Date.parse(fim);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 4;
  return limitarSemanas(Math.ceil(((b - a) / 86400000 + 1) / 7));
}

function cortar(t: string, max: number): string {
  const s = t.replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function montarPromptMetodologia(d: DadosMetodologia): string {
  const partes = [
    `Componente: ${cortar(d.componente, 120) || "não informado"}`,
    `Turma: ${cortar(d.turma, 80) || "não informada"}`,
    d.quantidadeAulas ? `Aulas previstas: ${cortar(d.quantidadeAulas, 10)}` : "",
    d.habilidades.length ? `Habilidades:\n${d.habilidades.slice(0, 12).map((h) => `- ${cortar(h, 260)}`).join("\n")}` : "",
    d.competencias.length ? `Competências:\n${d.competencias.slice(0, 4).map((c) => `- ${cortar(c, 200)}`).join("\n")}` : "",
    d.conteudos ? `Conteúdos: ${cortar(d.conteudos, 900)}` : "",
    d.instrucoes ? `Pedido do professor: ${cortar(d.instrucoes, 500)}` : "",
  ].filter(Boolean);
  const ordinais = ORDINAIS.slice(0, d.semanas).join(", ");
  return (
    `${partes.join("\n")}\n\n` +
    `Escreva o caminho metodológico em ${d.semanas} semana(s) (${ordinais}). ` +
    `Cada semana tem um parágrafo de 2 a 4 frases com o que será feito em sala (estratégias, atividades, recursos), ligando as habilidades e os conteúdos. ` +
    `Devolva JSON no formato {"semanas":[{"texto":"..."}]} com exatamente ${d.semanas} item(ns), sem o título da semana dentro do texto.`
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

/** Transforma a resposta em parágrafos "PRIMEIRA SEMANA: ...". Devolve [] se nada aproveitável. */
export function paragrafosDaResposta(texto: string, semanas: number): string[] {
  const dados = extrairJson(texto) as { semanas?: unknown } | null;
  let itens: string[] = [];
  if (dados && Array.isArray(dados.semanas)) {
    itens = dados.semanas
      .map((s) => (typeof s === "string" ? s : s && typeof s === "object" && typeof (s as { texto?: unknown }).texto === "string" ? (s as { texto: string }).texto : ""))
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  } else {
    // Resposta em texto corrido: um parágrafo por linha em branco.
    itens = texto
      .split(/\n{1,}/)
      .map((l) => l.replace(/^[\s*#\-–•]+/, "").replace(/^(primeira|segunda|terceira|quarta|quinta|sexta)\s+semana\s*[:\-–]\s*/i, "").trim())
      .filter((l) => l.length > 20);
  }
  return itens.slice(0, limitarSemanas(semanas)).map((t, i) => `${ORDINAIS[i]} SEMANA: ${t.replace(/^(primeira|segunda|terceira|quarta|quinta|sexta)\s+semana\s*[:\-–]\s*/i, "")}`);
}
