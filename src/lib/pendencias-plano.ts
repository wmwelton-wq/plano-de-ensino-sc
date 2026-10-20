// Confere o que o professor ainda não preencheu num plano já salvo (mensal ou anual).
// Só orienta: nunca trava o plano nem muda o formato dele. Sem dependência de DOM nem de Supabase.
import { lerSecoes, ordenarComponentes } from "./secoes-componentes";
import { normalizarComponentes, normalizarDados, type DadosPlanoAnual, type PlanoAnual } from "./plano-anual";

export interface Pendencia {
  /** Frase mostrada ao professor. */
  texto: string;
  /** Passo do formulário onde se resolve (o botão "Ir para lá" abre o plano nesse passo). */
  passo: string;
}

/** HTML do editor sem nada visível dentro? (imagens e tabelas contam como conteúdo) */
export function htmlVazio(html: string | null | undefined): boolean {
  const t = (html ?? "").replace(/<!--rt-->/g, "").trim();
  if (!t) return true;
  if (/<(img|table|li)[\s>]/i.test(t)) return false;
  return t.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";
}

const UNICO = "__unico__";

export interface PlanoMensalParaConferir {
  etapa: string | null;
  turma: string | null;
  escola_id: string | null;
  disciplina_id: string | null;
  curso_tecnico_id: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  quantidade_aulas: number | null;
  conteudos_programaticos: string | null;
  metodologia: string | null;
  avaliacao: string | null;
  instrumentos_avaliacao: string | null;
  secoes_componentes: unknown;
}

export interface ContextoMensal {
  /** Quantas competências o plano tem marcadas. */
  competencias: number;
  /** Quantas habilidades (ou objetivos de aprendizagem, na Educação Infantil) o plano tem marcadas. */
  habilidades: number;
  /** Anos Iniciais: componentes do plano. */
  componentes?: { id: string; nome: string }[];
}

/** O que falta no plano mensal. As chaves de passo são as mesmas do formulário de cada etapa. */
export function pendenciasMensal(plano: PlanoMensalParaConferir, ctx: ContextoMensal): Pendencia[] {
  const p: Pendencia[] = [];
  const etapa = plano.etapa ?? "ensino_medio";
  const infantil = etapa === "educacao_infantil";
  const iniciais = etapa === "fundamental_anos_iniciais";
  const passoIdent = infantil ? "passo-1" : "ident";

  if (!plano.escola_id) p.push({ texto: "Escola não escolhida (o plano ficará em “Sem escola definida”).", passo: passoIdent });
  if (!(plano.turma ?? "").trim()) p.push({ texto: "Turma não informada.", passo: passoIdent });
  if (!plano.data_inicio || !plano.data_fim) p.push({ texto: "Período do plano (datas de início e fim) não informado.", passo: passoIdent });
  if (!infantil && !plano.quantidade_aulas) p.push({ texto: "Número de aulas não informado.", passo: passoIdent });

  if (infantil) {
    if (ctx.habilidades === 0) p.push({ texto: "Nenhum objetivo de aprendizagem marcado.", passo: "passo-2" });
    if (htmlVazio(plano.conteudos_programaticos)) p.push({ texto: "Experiências / conteúdos em branco.", passo: "passo-3" });
    if (htmlVazio(plano.metodologia)) p.push({ texto: "Metodologia em branco.", passo: "passo-4" });
    if (htmlVazio(plano.avaliacao)) p.push({ texto: "Avaliação em branco.", passo: "passo-5" });
    if (htmlVazio(plano.instrumentos_avaliacao)) p.push({ texto: "Instrumentos de avaliação em branco.", passo: "passo-5" });
    return p;
  }

  const ehCurso = Boolean(plano.curso_tecnico_id) && !plano.disciplina_id;

  if (iniciais) {
    const comps = ordenarComponentes(ctx.componentes ?? []);
    if (comps.length === 0) {
      p.push({ texto: "Nenhum componente curricular escolhido.", passo: "componentes" });
      return p;
    }
    const primeiro = comps[0].id;
    if (ctx.competencias === 0) p.push({ texto: "Nenhuma competência marcada.", passo: `comp-${primeiro}` });
    if (ctx.habilidades === 0) p.push({ texto: "Nenhuma habilidade marcada.", passo: `hab-${primeiro}` });
    const secoes = lerSecoes(plano.secoes_componentes);
    for (const c of comps) {
      const s = secoes.find((x) => x.disciplina_id === c.id);
      const pre = `${c.nome} — `;
      const usaGlobal = secoes.length === 0 && c.id === primeiro;
      const conteudos = usaGlobal ? plano.conteudos_programaticos : s?.conteudos;
      const metodologia = usaGlobal ? plano.metodologia : s?.metodologia;
      const criterios = usaGlobal ? plano.avaliacao : s?.criterios;
      const instrumentos = usaGlobal ? plano.instrumentos_avaliacao : s?.instrumentos;
      if (htmlVazio(conteudos)) p.push({ texto: `${pre}objetos de conhecimento / conteúdos em branco.`, passo: `obj-${c.id}` });
      if (htmlVazio(metodologia)) p.push({ texto: `${pre}caminho metodológico em branco.`, passo: `metod-${c.id}` });
      if (htmlVazio(criterios)) p.push({ texto: `${pre}critérios de avaliação em branco.`, passo: `aval-${c.id}` });
      if (htmlVazio(instrumentos)) p.push({ texto: `${pre}instrumentos de avaliação em branco.`, passo: `aval-${c.id}` });
    }
    return p;
  }

  // Anos Finais e Ensino Médio / Técnico. Em curso técnico não há lista de competências/habilidades para marcar.
  if (!ehCurso && ctx.competencias === 0) p.push({ texto: "Nenhuma competência marcada.", passo: "comp" });
  if (htmlVazio(plano.conteudos_programaticos)) p.push({ texto: "Objetos de conhecimento / conteúdos em branco.", passo: "obj" });
  if (!ehCurso && ctx.habilidades === 0) p.push({ texto: "Nenhuma habilidade marcada.", passo: "hab" });
  if (htmlVazio(plano.metodologia)) p.push({ texto: "Caminho metodológico em branco.", passo: "metod" });
  if (htmlVazio(plano.avaliacao)) p.push({ texto: "Critérios de avaliação em branco.", passo: "aval" });
  if (htmlVazio(plano.instrumentos_avaliacao)) p.push({ texto: "Instrumentos de avaliação em branco.", passo: "aval" });
  return p;
}

/** O que falta no plano anual (mesma conferência do passo "Revisar e salvar", mas feita sobre o plano já salvo). */
export function pendenciasAnual(plano: PlanoAnual): Pendencia[] {
  const p: Pendencia[] = [];
  if (!plano.escola_id) p.push({ texto: "Escola não escolhida (o plano ficará em “Sem escola definida”).", passo: "ident" });
  if (!(plano.componente ?? "").trim() && !plano.disciplina_id) p.push({ texto: "Componente curricular não informado.", passo: "ident" });
  if (!(plano.turma ?? "").trim()) p.push({ texto: "Turma não informada.", passo: "ident" });
  if (!(plano.turno ?? "").trim()) p.push({ texto: "Turno não informado.", passo: "ident" });
  if (!(plano.docente ?? "").trim()) p.push({ texto: "Nome do docente não informado.", passo: "ident" });

  const componentes = normalizarComponentes(plano.componentes, plano.competencias_gerais);
  const geral = normalizarDados(plano);
  const gerais = componentes.length > 0 ? componentes[0].competenciasGerais : geral.competenciasGerais;
  if (gerais.numeros.length + gerais.manuais.length === 0) p.push({ texto: "Nenhuma competência geral da BNCC marcada.", passo: "gerais" });

  const conferir = (d: Pick<DadosPlanoAnual, "ementa" | "competenciasEspecificas" | "trimestres">, chave: string, prefixo: string) => {
    if (d.ementa.length === 0) p.push({ texto: `${prefixo}Ementa vazia.`, passo: `ementa|${chave}` });
    const ce = d.competenciasEspecificas;
    if (ce.bncc.length + ce.curriculo.length + ce.manuais.length === 0) p.push({ texto: `${prefixo}Nenhuma competência específica marcada.`, passo: `esp|${chave}` });
    d.trimestres.forEach((t, i) => {
      const n = `${prefixo}${i + 1}º trimestre`;
      const passo = `tri${i}|${chave}`;
      if (t.unidades.length === 0) p.push({ texto: `${n}: nenhuma unidade temática.`, passo });
      if (t.habilidades.length === 0) p.push({ texto: `${n}: nenhuma habilidade.`, passo });
      if (t.objetos.length === 0) p.push({ texto: `${n}: nenhum objeto de conhecimento.`, passo });
      if (t.criterios.length === 0) p.push({ texto: `${n}: nenhum critério de avaliação.`, passo });
      if (t.metodologia.length === 0) p.push({ texto: `${n}: nenhuma metodologia.`, passo });
    });
  };

  if (componentes.length > 0) {
    for (const c of componentes) conferir(c, c.disciplina_id, `${c.nome || "Componente"} — `);
  } else {
    // Plano de um componente só (ou plano antigo dos Anos Iniciais): o formulário usa a chave interna "__unico__"
    // quando não há disciplina do sistema; com disciplina dos Anos Iniciais, a chave é o id dela.
    const chave = plano.etapa === "fundamental_anos_iniciais" && plano.disciplina_id ? plano.disciplina_id : UNICO;
    conferir(geral, chave, "");
  }
  return p;
}

/** Endereço que abre o plano já no passo certo. */
export function enderecoDoPasso(tipo: "mensal" | "anual", planoId: string, etapa: string | null | undefined, passo: string): string {
  if (tipo === "mensal") {
    const base = `/dashboard/planos/${planoId}`;
    // A Educação Infantil é uma página só, com âncoras.
    return etapa === "educacao_infantil" ? `${base}#${passo}` : `${base}?passo=${encodeURIComponent(passo)}`;
  }
  return `/dashboard/anual/${planoId}?passo=${encodeURIComponent(passo)}`;
}
