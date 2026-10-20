"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Marca ou desmarca um plano como favorito ("em uso"). A segurança (só o dono altera) vem do RLS do banco. */
export async function alternarFavorito(tipo: "mensais" | "anuais", planoId: string, favorito: boolean): Promise<boolean> {
  if (!UUID.test(planoId)) return false;
  const supabase = await createClient();
  const tabela = tipo === "anuais" ? "planos_anuais" : "planos_de_ensino";
  const { error } = await supabase.from(tabela).update({ favorito }).eq("id", planoId);
  if (error) return false;
  revalidatePath("/dashboard", "layout");
  return true;
}

const BUCKET_COMPARTILHADOS = "compartilhados";
const MAX_EM_LOTE = 100;

function idsValidos(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  return Array.from(new Set(ids.filter((x): x is string => typeof x === "string" && UUID.test(x)))).slice(0, MAX_EM_LOTE);
}

/** Apaga os links de leitura (e os PDFs guardados) dos planos informados. Só alcança os do próprio professor (RLS). */
async function apagarLinks(supabase: Awaited<ReturnType<typeof createClient>>, tipo: "mensais" | "anuais", ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const { data, error } = await supabase
    .from("plano_compartilhamentos")
    .select("id, arquivo_path")
    .eq("plano_tipo", tipo === "anuais" ? "anual" : "mensal")
    .in("plano_id", ids);
  if (error) return false;
  const linhas = (data ?? []) as { id: string; arquivo_path: string }[];
  if (linhas.length === 0) return true;
  await supabase.storage.from(BUCKET_COMPARTILHADOS).remove(linhas.map((l) => l.arquivo_path));
  const { error: erroApagar } = await supabase.from("plano_compartilhamentos").delete().in("id", linhas.map((l) => l.id));
  return !erroApagar;
}

/** Para de compartilhar vários planos de uma vez: os links deixam de funcionar. */
export async function pararDeCompartilharVarios(tipo: "mensais" | "anuais", planoIds: string[]): Promise<{ ok: boolean; erro?: string }> {
  if (tipo !== "mensais" && tipo !== "anuais") return { ok: false, erro: "Tipo de plano inválido." };
  const ids = idsValidos(planoIds);
  if (ids.length === 0) return { ok: false, erro: "Nenhum plano escolhido." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const ok = await apagarLinks(supabase, tipo, ids);
  revalidatePath("/dashboard/meus-planos", "layout");
  return ok ? { ok: true } : { ok: false, erro: "Não foi possível encerrar o compartilhamento agora. Tente novamente." };
}

/**
 * Exclui vários planos de uma vez (e os links de leitura deles). Só apaga planos do próprio professor:
 * a regra de acesso do banco confere isso, e o resultado diz quantos foram de fato excluídos.
 */
export async function excluirPlanosEmLote(tipo: "mensais" | "anuais", planoIds: string[]): Promise<{ excluidos: number; erro?: string }> {
  if (tipo !== "mensais" && tipo !== "anuais") return { excluidos: 0, erro: "Tipo de plano inválido." };
  const ids = idsValidos(planoIds);
  if (ids.length === 0) return { excluidos: 0, erro: "Nenhum plano escolhido." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { excluidos: 0, erro: "Sessão expirada. Entre novamente." };

  const tabela = tipo === "anuais" ? "planos_anuais" : "planos_de_ensino";
  const { data, error } = await supabase.from(tabela).delete().eq("professor_id", user.id).in("id", ids).select("id");
  if (error) return { excluidos: 0, erro: "Não foi possível excluir agora. Tente novamente." };
  const apagados = (data ?? []).map((l: { id: string }) => l.id);
  await apagarLinks(supabase, tipo, apagados);

  revalidatePath("/dashboard", "layout");
  return { excluidos: apagados.length };
}
