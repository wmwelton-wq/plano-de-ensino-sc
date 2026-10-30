import type { ObjetoConhecimentoMedio } from "@/lib/database.types";

interface ClienteComConsulta {
  from: (tabela: string) => {
    select: (colunas: string) => PromiseLike<{ data: unknown; error: unknown }>;
  };
}

/**
 * Junta a cada objeto de conhecimento do Ensino Médio as habilidades sugeridas para ele.
 * Se a consulta falhar, devolve os objetos como estavam: o plano continua funcionando, só sem as sugestões.
 */
export async function anexarSugestoesMedio(
  cliente: unknown,
  objetos: ObjetoConhecimentoMedio[]
): Promise<ObjetoConhecimentoMedio[]> {
  if (objetos.length === 0) return objetos;
  try {
    const supabase = cliente as ClienteComConsulta;
    const { data, error } = await supabase.from("habilidade_objeto_medio").select("objeto_id, habilidade_id");
    if (error || !Array.isArray(data)) return objetos;
    const porObjeto = new Map<string, { habilidade_id: string }[]>();
    for (const v of data as { objeto_id: string; habilidade_id: string }[]) {
      const lista = porObjeto.get(v.objeto_id) ?? [];
      lista.push({ habilidade_id: v.habilidade_id });
      porObjeto.set(v.objeto_id, lista);
    }
    return objetos.map((o) => ({ ...o, habilidade_objeto_medio: porObjeto.get(o.id) ?? [] }));
  } catch {
    return objetos;
  }
}
