import { createHmac } from "node:crypto";
import { criarClienteServico } from "@/lib/supabase/admin";

/**
 * Limite de tentativas guardado no banco (vale para TODAS as instâncias do servidor; o limite em memória
 * de rate-limit.ts vale só por instância). Só roda no servidor.
 *
 * - O IP nunca é guardado: vira um código embaralhado (HMAC) que só o servidor consegue reproduzir.
 * - Falha aberta: sem chave de servico, sem identificador, com RATE_LIMIT_TURNSTILE=false ou em qualquer
 *   erro do banco, devolve `false` (não bloqueia). Um problema aqui nunca deve derrubar o login.
 */
export async function limitadoNoBanco(opcoes: {
  bucket: string;
  identifier: string | null | undefined;
  windowMs: number;
  maxAttempts: number;
  blockMs: number;
}): Promise<boolean> {
  try {
    if (process.env.RATE_LIMIT_TURNSTILE === "false") return false;
    if (!opcoes.identifier) return false;
    const segredo = process.env.SUPABASE_SECRET_KEY;
    const supabase = criarClienteServico();
    if (!segredo || !supabase) {
      console.error("[limite-banco] limite distribuído DESATIVADO: cliente de serviço indisponível (confira SUPABASE_SECRET_KEY).");
      return false;
    }

    const codigo = createHmac("sha256", segredo).update(`${opcoes.bucket}:${opcoes.identifier}`).digest("hex");
    const { data, error } = await supabase.rpc("registrar_tentativa", {
      p_chave: `${opcoes.bucket}:${codigo}`,
      p_janela_seg: Math.max(1, Math.round(opcoes.windowMs / 1000)),
      p_max: Math.max(1, Math.round(opcoes.maxAttempts)),
      p_bloqueio_seg: Math.max(1, Math.round(opcoes.blockMs / 1000)),
    });
    if (error) {
      console.error("[limite-banco] falha ao registrar tentativa (limite aberto nesta requisição):", error.message);
      return false;
    }
    return data === true;
  } catch (e) {
    console.error("[limite-banco] erro inesperado (limite aberto nesta requisição):", e instanceof Error ? e.message : String(e));
    return false;
  }
}
