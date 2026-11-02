import type { SupabaseClient } from "@supabase/supabase-js";
import { criarClienteServico } from "@/lib/supabase/admin";

/**
 * Fecha o registro de uso (IA ou e-mail) aberto pela reserva.
 *
 * Quem pede a reserva é o professor (cliente normal), mas quem FECHA é o servidor, com a chave secreta:
 * assim o professor não consegue chamar o fechamento direto pelo navegador para "devolver" a cota ou
 * zerar o custo registrado. `uid` precisa vir de supabase.auth.getUser() (nunca de dados enviados pelo usuário).
 * Sem a chave secreta (ex.: ambiente de prévia), cai na função antiga, que continua restrita ao próprio usuário.
 */
export interface DadosFechamentoIA {
  modelo: string;
  tokensEntrada: number;
  tokensSaida: number;
  custo: number;
  status: "ok" | "erro";
}

export async function finalizarUsoIA(supabase: SupabaseClient, uid: string, id: string, d: DadosFechamentoIA): Promise<void> {
  const servico = criarClienteServico();
  const args = { p_id: id, p_modelo: d.modelo, p_tokens_entrada: d.tokensEntrada, p_tokens_saida: d.tokensSaida, p_custo: d.custo, p_status: d.status };
  if (servico) {
    const { error } = await servico.rpc("ia_finalizar_servico", { p_uid: uid, ...args });
    if (!error) return;
    console.error("[ia] falha ao fechar uso pelo servidor", error.code ?? "");
  }
  await supabase.rpc("ia_finalizar", args);
}

export async function finalizarEnvioEmail(supabase: SupabaseClient, uid: string, id: string, ok: boolean): Promise<void> {
  const servico = criarClienteServico();
  if (servico) {
    const { error } = await servico.rpc("email_finalizar_envio_servico", { p_uid: uid, p_id: id, p_ok: ok });
    if (!error) return;
    console.error("[email] falha ao fechar envio pelo servidor", error.code ?? "");
  }
  await supabase.rpc("email_finalizar_envio", { p_id: id, p_ok: ok });
}
