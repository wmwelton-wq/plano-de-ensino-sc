"use server";

import { createClient } from "@/lib/supabase/server";
import {
  infoNivel,
  type ComponenteRecomposicao,
  type DadosRecomposicao,
  type HabilidadeRecomposicao,
  type NivelRecomposicao,
  type ObjetoMedioRecomposicao,
} from "@/lib/recomposicao";

const TAMANHO_PAGINA = 1000;
const COLUNAS = "id, codigo, descricao, ano_serie, objeto_conhecimento, conteudos, fonte, disciplina_id, area, etapa";

/**
 * Habilidades e objetos de conhecimento de Língua Portuguesa ou Matemática em UM nível (Anos Iniciais, Anos Finais
 * ou Ensino Médio), para o professor escolher o que quer recompor. Só leitura; a lista é pequena (poucas centenas
 * de linhas), por isso vem inteira e o filtro por ano é feito na tela.
 */
export async function carregarRecomposicao(
  nivel: NivelRecomposicao,
  componente: ComponenteRecomposicao
): Promise<DadosRecomposicao> {
  const vazio: DadosRecomposicao = { habilidades: [], objetosMedio: [] };
  if (!["iniciais", "finais", "medio"].includes(nivel) || !["portugues", "matematica"].includes(componente)) {
    return { ...vazio, erro: "Pedido inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...vazio, erro: "Sessão expirada. Faça login novamente." };

  const etapas = infoNivel(nivel).etapas;
  const { data: disciplinas, error: erroDisc } = await supabase
    .from("disciplinas")
    .select("id, nome, area")
    .in("etapa", etapas)
    .ilike("nome", componente === "portugues" ? "%portugu%" : "%matem%");
  if (erroDisc) return { ...vazio, erro: "Não foi possível carregar a lista agora. Tente novamente." };

  const lista = (disciplinas ?? []) as { id: string; nome: string; area: string | null }[];
  if (lista.length === 0) return vazio;
  const ids = lista.map((d) => d.id);
  const areas = Array.from(new Set(lista.map((d) => d.area).filter((a): a is string => Boolean(a))));

  const habilidades: HabilidadeRecomposicao[] = [];
  const vistos = new Set<string>();
  const guardar = (linhas: unknown[]) => {
    for (const l of linhas as HabilidadeRecomposicao[]) {
      if (vistos.has(l.id)) continue;
      vistos.add(l.id);
      habilidades.push({
        id: l.id,
        codigo: l.codigo,
        descricao: l.descricao,
        ano_serie: l.ano_serie,
        objeto_conhecimento: l.objeto_conhecimento,
        conteudos: l.conteudos ?? null,
        fonte: l.fonte,
      });
    }
  };

  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const { data, error } = await supabase
      .from("habilidades_curriculares")
      .select(COLUNAS)
      .eq("validado", true)
      .neq("fonte", "curriculo_educacao_digital")
      .in("disciplina_id", ids)
      .order("codigo", { nullsFirst: false })
      .order("id")
      .range(inicio, inicio + TAMANHO_PAGINA - 1);
    if (error) return { ...vazio, erro: "Não foi possível carregar a lista agora. Tente novamente." };
    guardar(data ?? []);
    if ((data ?? []).length < TAMANHO_PAGINA) break;
  }

  // Ensino Médio: também há habilidades da área (sem disciplina), como na tela do plano.
  if (nivel === "medio" && areas.length > 0) {
    const { data } = await supabase
      .from("habilidades_curriculares")
      .select(COLUNAS)
      .eq("validado", true)
      .neq("fonte", "curriculo_educacao_digital")
      .is("disciplina_id", null)
      .in("area", areas)
      .in("etapa", etapas)
      .order("codigo", { nullsFirst: false })
      .limit(TAMANHO_PAGINA);
    guardar(data ?? []);
  }

  let objetosMedio: ObjetoMedioRecomposicao[] = [];
  if (nivel === "medio") {
    const { data } = await supabase
      .from("objetos_conhecimento_medio")
      .select("serie, objeto, conteudos")
      .in("disciplina_id", ids)
      .order("objeto");
    objetosMedio = ((data ?? []) as ObjetoMedioRecomposicao[]).map((o) => ({
      serie: Number(o.serie),
      objeto: o.objeto,
      conteudos: o.conteudos ?? null,
    }));
  }

  return { habilidades, objetosMedio };
}
