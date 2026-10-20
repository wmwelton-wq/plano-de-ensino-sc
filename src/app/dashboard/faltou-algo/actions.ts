"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const TIPOS_SUGESTAO = ["competencia", "objeto_conhecimento", "habilidade", "conteudo", "avaliacao", "referencia", "outro"] as const;
export type TipoSugestao = (typeof TIPOS_SUGESTAO)[number];

export interface DadosSugestao {
  tipo: string;
  etapa?: string;
  disciplina?: string;
  serie?: string;
  descricao: string;
}

function limpar(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** O professor avisa que faltou algo no plano (competência, objeto de conhecimento, habilidade...). Vai para o painel do administrador. */
export async function enviarSugestao(dados: DadosSugestao): Promise<{ ok?: true; erro?: string }> {
  const tipo = limpar(dados?.tipo, 40) as TipoSugestao;
  if (!(TIPOS_SUGESTAO as readonly string[]).includes(tipo)) return { erro: "Escolha o que faltou." };
  const descricao = limpar(dados?.descricao, 2000);
  if (descricao.length < 3) return { erro: "Escreva o que está faltando." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre novamente." };

  // Limite simples contra excesso: 20 avisos por dia.
  const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabase.from("sugestoes_faltou").select("id", { count: "exact", head: true }).gte("created_at", desde);
  if ((count ?? 0) >= 20) return { erro: "Você já enviou muitos avisos hoje. Tente de novo amanhã." };

  const { error } = await supabase.from("sugestoes_faltou").insert({
    professor_id: user.id,
    tipo,
    etapa: limpar(dados.etapa, 80) || null,
    disciplina_nome: limpar(dados.disciplina, 120) || null,
    serie: limpar(dados.serie, 40) || null,
    descricao,
  });
  if (error) return { erro: "Não foi possível enviar agora. Tente novamente em instantes." };
  revalidatePath("/dashboard/faltou-algo");
  return { ok: true };
}
