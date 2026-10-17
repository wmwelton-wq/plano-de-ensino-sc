// Busca, no banco, tudo o que o professor pode MARCAR no plano anual para um
// componente curricular: habilidades (BNCC, Currículo Catarinense e Educação
// Digital), objetos de conhecimento/conteúdos, unidades temáticas e competências
// específicas. Roda no navegador (cliente Supabase com a sessão do professor).

import {
  chaveTexto,
  dividirConteudos,
  dividirObjetos,
  eixoDoObjeto,
  expandirAnos,
  type ItemLista,
} from "./plano-anual";

export interface DisciplinaBasica {
  id: string;
  nome: string;
  area: string | null;
  etapa: string | null;
}

/** Uma opção de lista: o que aparece com a caixinha de marcar. */
export interface OpcaoLista {
  id: string;
  texto: string;
  codigo?: string | null;
  fonte?: string | null;
  /** Rótulo de agrupamento/filtro (ex.: "Da área", "Do componente", "Conteúdo"). */
  grupo?: string;
  /** Anos/séries em que o item aparece ("6º ano"...). Vazio = vale para qualquer ano. */
  anos: string[];
  /** Só nas habilidades: ids dos objetos de conhecimento ligados a ela no currículo. */
  relacionados?: string[];
}

export interface DadosComponente {
  habilidades: OpcaoLista[];
  objetos: OpcaoLista[];
  unidades: OpcaoLista[];
  competencias: OpcaoLista[];
  /** Anos/séries que existem nos dados, em ordem. */
  anos: string[];
}

export const DADOS_VAZIOS: DadosComponente = {
  habilidades: [],
  objetos: [],
  unidades: [],
  competencias: [],
  anos: [],
};

/** Só o que precisamos do cliente Supabase (aceita o do navegador e o do servidor). */
export interface ClienteBanco {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (tabela: string) => any;
}

interface LinhaHabilidade {
  id: string;
  codigo: string | null;
  descricao: string;
  fonte: string;
  ano_serie: string | null;
  unidade_tematica: string | null;
  objeto_conhecimento: string | null;
  conteudos: string | null;
}

const COLUNAS_HAB = "id, codigo, descricao, fonte, ano_serie, unidade_tematica, objeto_conhecimento, conteudos";

const ehMedio = (etapa: string | null | undefined) => (etapa ?? "").toLowerCase().includes("médio");

/** Anos que existem em cada etapa (para abrir "1º ao 5º ano" só dentro da etapa certa). */
function limitesDaEtapa(etapa: string | null | undefined): [number, number] | undefined {
  const e = (etapa ?? "").toLowerCase();
  if (e.includes("iniciais")) return [1, 5];
  if (e.includes("finais")) return [6, 9];
  if (e.includes("médio")) return [1, 3];
  return undefined;
}

function ordemAno(a: string): number {
  const m = /\d+/.exec(a);
  return m ? Number(m[0]) : 99;
}

/** Junta itens iguais (mesmo texto) somando os anos em que aparecem. */
function agrupar(itens: OpcaoLista[]): OpcaoLista[] {
  const mapa = new Map<string, OpcaoLista>();
  for (const it of itens) {
    const c = `${it.grupo ?? ""}|${chaveTexto(it.texto)}`;
    const existente = mapa.get(c);
    if (!existente) {
      mapa.set(c, { ...it, anos: [...it.anos] });
    } else {
      for (const a of it.anos) if (!existente.anos.includes(a)) existente.anos.push(a);
    }
  }
  return Array.from(mapa.values());
}

export async function carregarDadosComponente(
  supabase: ClienteBanco,
  disciplina: DisciplinaBasica
): Promise<DadosComponente> {
  const medio = ehMedio(disciplina.etapa);
  const etapaTxt = disciplina.etapa ?? "";

  // ── Habilidades ──
  const habilidadesBrutas: LinhaHabilidade[] = [];
  const consultas: PromiseLike<{ data: LinhaHabilidade[] | null }>[] = [];

  consultas.push(
    supabase
      .from("habilidades_curriculares")
      .select(COLUNAS_HAB)
      .eq("validado", true)
      .eq("disciplina_id", disciplina.id)
      .in("fonte", ["bncc", "curriculo_catarinense"])
      .order("codigo", { nullsFirst: false })
      .limit(1000)
  );
  if (medio && disciplina.area) {
    // No Ensino Médio as habilidades são da ÁREA (EM13CNT..., EM13CHS..., EM13LGG...).
    consultas.push(
      supabase
        .from("habilidades_curriculares")
        .select(COLUNAS_HAB)
        .eq("validado", true)
        .is("disciplina_id", null)
        .eq("area", disciplina.area)
        .in("fonte", ["bncc", "curriculo_catarinense"])
        .order("codigo", { nullsFirst: false })
        .limit(1000)
    );
  }
  consultas.push(
    supabase
      .from("habilidades_curriculares")
      .select(COLUNAS_HAB)
      .eq("validado", true)
      .eq("fonte", "curriculo_educacao_digital")
      .eq("etapa", etapaTxt)
      .order("codigo", { nullsFirst: false })
      .limit(1000)
  );

  const [resultados, objetosMedio, competenciasDisc, competenciasArea] = await Promise.all([
    Promise.all(consultas),
    medio
      ? (supabase
          .from("objetos_conhecimento_medio")
          .select("id, serie, objeto, conteudos")
          .eq("disciplina_id", disciplina.id)
          .order("serie")
          .order("objeto") as PromiseLike<{
          data: { id: string; serie: number; objeto: string; conteudos: string | null }[] | null;
        }>)
      : Promise.resolve({ data: null }),
    supabase
      .from("competencias_curriculares")
      .select("id, numero, titulo, descricao, fonte, area, disciplina_id")
      .eq("disciplina_id", disciplina.id)
      .order("numero") as PromiseLike<{ data: LinhaCompetencia[] | null }>,
    disciplina.area
      ? (supabase
          .from("competencias_curriculares")
          .select("id, numero, titulo, descricao, fonte, area, disciplina_id")
          .is("disciplina_id", null)
          .eq("area", disciplina.area)
          .eq("etapa", etapaTxt)
          .order("numero") as PromiseLike<{ data: LinhaCompetencia[] | null }>)
      : Promise.resolve({ data: null }),
  ]);

  const vistos = new Set<string>();
  for (const r of resultados) {
    for (const h of r.data ?? []) {
      if (vistos.has(h.id)) continue;
      vistos.add(h.id);
      habilidadesBrutas.push(h);
    }
  }

  const anosSet = new Set<string>();
  const limites = limitesDaEtapa(disciplina.etapa);
  /** Cada item vale para vários anos? Repete em todos eles (nada de "1º ao 5º ano" como botão). */
  const anosDe = (anoSerie: string | null | undefined): string[] => {
    const lista = expandirAnos(anoSerie, limites, medio);
    for (const a of lista) anosSet.add(a);
    return lista;
  };

  const habilidades: OpcaoLista[] = habilidadesBrutas.map((h) => {
    return {
      id: h.id,
      texto: h.descricao.trim(),
      codigo: h.codigo,
      fonte: h.fonte,
      anos: anosDe(h.ano_serie),
      relacionados:
        h.fonte === "curriculo_educacao_digital"
          ? []
          : [
              ...dividirObjetos(h.objeto_conhecimento).map((t) => `obj:${chaveTexto(t)}`),
              ...dividirConteudos(h.conteudos).map((t) => `cont:${chaveTexto(t)}`),
            ],
    };
  });

  // ── Objetos de conhecimento, conteúdos e unidades temáticas ──
  const objetosBrutos: OpcaoLista[] = [];
  const unidadesBrutas: OpcaoLista[] = [];

  for (const h of habilidadesBrutas) {
    if (h.fonte === "curriculo_educacao_digital") continue;
    const anos = anosDe(h.ano_serie);
    for (const t of dividirObjetos(h.objeto_conhecimento)) {
      objetosBrutos.push({ id: `obj:${chaveTexto(t)}`, texto: t, grupo: "Objeto de conhecimento", anos });
    }
    for (const t of dividirConteudos(h.conteudos)) {
      objetosBrutos.push({ id: `cont:${chaveTexto(t)}`, texto: t, grupo: "Conteúdo", anos });
    }
    if (h.unidade_tematica) {
      unidadesBrutas.push({
        id: `un:${chaveTexto(h.unidade_tematica)}`,
        texto: h.unidade_tematica.trim(),
        grupo: "BNCC",
        anos,
      });
    }
    const eixo = eixoDoObjeto(h.objeto_conhecimento);
    if (eixo) {
      unidadesBrutas.push({ id: `un:${chaveTexto(eixo)}`, texto: eixo, grupo: "Currículo Catarinense", anos });
    }
  }

  for (const o of objetosMedio.data ?? []) {
    const ano = `${o.serie}ª série`;
    anosSet.add(ano);
    objetosBrutos.push({ id: `objm:${o.id}`, texto: o.objeto.trim(), grupo: "Objeto de conhecimento", anos: [ano] });
    for (const t of dividirConteudos(o.conteudos)) {
      objetosBrutos.push({ id: `cont:${chaveTexto(t)}`, texto: t, grupo: "Conteúdo", anos: [ano] });
    }
    unidadesBrutas.push({ id: `un:${chaveTexto(o.objeto)}`, texto: o.objeto.trim(), grupo: "Currículo Catarinense", anos: [ano] });
  }

  // ── Competências específicas (BNCC e Currículo Catarinense, separadas) ──
  const competencias: OpcaoLista[] = [];
  const juntaCompetencias = (linhas: LinhaCompetencia[] | null, escopo: string) => {
    for (const c of linhas ?? []) {
      competencias.push({
        id: c.id,
        texto: (c.titulo ? `${c.titulo} – ` : "") + c.descricao.trim(),
        codigo: String(c.numero),
        fonte: c.fonte === "curriculo_catarinense" ? "curriculo_catarinense" : "bncc",
        grupo: escopo,
        anos: [],
      });
    }
  };
  juntaCompetencias(competenciasArea.data, "Da área do conhecimento");
  juntaCompetencias(competenciasDisc.data, "Do componente curricular");

  return {
    habilidades,
    objetos: agrupar(objetosBrutos),
    unidades: agrupar(unidadesBrutas),
    competencias,
    anos: Array.from(anosSet).sort((a, b) => ordemAno(a) - ordemAno(b) || a.localeCompare(b, "pt-BR")),
  };
}

interface LinhaCompetencia {
  id: string;
  numero: number;
  titulo: string | null;
  descricao: string;
  fonte: string;
  area: string | null;
  disciplina_id: string | null;
}

/** Converte uma opção marcada em item gravável no plano. */
export function opcaoParaItem(o: OpcaoLista): ItemLista {
  const item: ItemLista = { id: o.id, texto: o.texto };
  if (o.codigo) item.codigo = o.codigo;
  if (o.fonte) item.fonte = o.fonte;
  return item;
}
