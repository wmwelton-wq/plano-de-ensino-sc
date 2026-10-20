import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente do Supabase com a chave SECRETA. Uso EXCLUSIVO no servidor (ações de servidor e rotas).
 *
 * A chave vem da variável SUPABASE_SECRET_KEY (configurada só na Vercel, nunca começa com NEXT_PUBLIC_).
 * Ela ignora as regras de acesso por linha (RLS), então toda ação que a usa precisa antes confirmar,
 * com o cliente normal do usuário, quem está pedindo e se tem permissão. Sem a chave, devolve null
 * e as telas mostram um aviso claro em vez de quebrar.
 */
export function chaveSecretaConfigurada(): boolean {
  return Boolean(process.env.SUPABASE_SECRET_KEY);
}

export function criarClienteServico(): SupabaseClient | null {
  if (typeof window !== "undefined") throw new Error("O cliente de serviço só pode ser usado no servidor.");
  const chave = process.env.SUPABASE_SECRET_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!chave || !url) return null;
  return createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
