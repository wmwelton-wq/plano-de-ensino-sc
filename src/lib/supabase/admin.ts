import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente do Supabase com a chave SECRETA. Uso EXCLUSIVO no servidor (ações de servidor e rotas).
 *
 * A chave vem da variável SUPABASE_SECRET_KEY (configurada só na Vercel, nunca começa com NEXT_PUBLIC_).
 * Ela ignora as regras de acesso por linha (RLS), então toda ação que a usa precisa antes confirmar,
 * com o cliente normal do usuário, quem está pedindo e se tem permissão. Sem a chave, devolve null
 * e as telas mostram um aviso claro em vez de quebrar.
 */

/** Tira espaços e quebras de linha das pontas (erro comum ao colar) e confere se só tem caracteres válidos. */
function lerChaveSecreta(): string | null {
  const bruta = process.env.SUPABASE_SECRET_KEY;
  if (!bruta) return null;
  const chave = bruta.trim().replace(/^["']|["']$/g, "");
  // Uma chave válida é uma única palavra de caracteres ASCII visíveis (sb_secret_... ou um JWT).
  if (!/^[\x21-\x7E]{20,}$/.test(chave)) {
    console.error("[supabase-servico] SUPABASE_SECRET_KEY com formato inválido (espaço, quebra de linha, texto mascarado ou cortado). Cole a chave de novo na Vercel.");
    return null;
  }
  return chave;
}

export function chaveSecretaConfigurada(): boolean {
  return lerChaveSecreta() !== null;
}

export function criarClienteServico(): SupabaseClient | null {
  if (typeof window !== "undefined") throw new Error("O cliente de serviço só pode ser usado no servidor.");
  const chave = lerChaveSecreta();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!chave || !url) return null;
  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      // Deixa registrado no log da Vercel quando a chamada falha antes mesmo de chegar ao Supabase
      // (nunca imprime a chave).
      fetch: async (entrada, opcoes) => {
        try {
          const r = await fetch(entrada, opcoes);
          if (r.status === 401 || r.status === 403) console.error(`[supabase-servico] resposta ${r.status} do Supabase: a chave secreta foi recusada.`);
          return r;
        } catch (e) {
          console.error("[supabase-servico] falha ao chamar o Supabase:", e instanceof Error ? e.message : String(e));
          throw e;
        }
      },
    },
  });
}
