import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Guarda no registro de uso o tempo da chamada e o motivo das falhas (inclusive de provedores que falharam e foram
 * substituídos pelo reserva). O painel do administrador usa isso para mostrar qual IA está com problema. Nunca lança erro.
 */
export async function registrarDetalheIA(supabase: SupabaseClient, id: string, erro: string | null, duracaoMs: number | null): Promise<void> {
  try {
    await supabase.rpc("ia_registrar_detalhe", { p_id: id, p_erro: erro ?? "", p_duracao_ms: duracaoMs });
  } catch {
    // Só diagnóstico: se falhar, o uso da IA segue normalmente.
  }
}
