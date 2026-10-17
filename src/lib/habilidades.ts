import type { createClient } from "@/lib/supabase/server";
import type { HabilidadeCurricular } from "@/lib/database.types";

type ClienteSupabase = Awaited<ReturnType<typeof createClient>>;

const TAMANHO_PAGINA = 1000;

/**
 * Carrega TODAS as habilidades validadas (opcionalmente de uma etapa).
 *
 * O Supabase devolve no máximo 1.000 linhas por consulta; como a tabela passou de
 * 2.700 linhas (BNCC + Currículo Catarinense + educação digital), uma consulta simples
 * corta as últimas linhas — justamente os objetos de conhecimento do Currículo
 * Catarinense e as habilidades do Ensino Médio. Aqui lemos página por página.
 */
export async function carregarHabilidades(
  supabase: ClienteSupabase,
  etapa?: string
): Promise<{ data: HabilidadeCurricular[]; error: string | null }> {
  const todas: HabilidadeCurricular[] = [];
  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    let consulta = supabase.from("habilidades_curriculares").select("*").eq("validado", true);
    if (etapa) consulta = consulta.eq("etapa", etapa);
    const { data, error } = await consulta
      .order("codigo", { nullsFirst: false })
      .order("id")
      .range(inicio, inicio + TAMANHO_PAGINA - 1);
    if (error) return { data: todas, error: error.message };
    const lote = (data ?? []) as HabilidadeCurricular[];
    todas.push(...lote);
    if (lote.length < TAMANHO_PAGINA) break;
  }
  return { data: todas, error: null };
}
