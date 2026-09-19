import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em Client Components (roda no navegador).
 * Usa a chave pública (publishable) — nunca a chave secreta aqui.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
