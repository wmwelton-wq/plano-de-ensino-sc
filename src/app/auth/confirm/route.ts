import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Rota chamada pelo link enviado por email (confirmação de cadastro ou
 * recuperação de senha). Troca o token de uma vez (token_hash) por uma
 * sessão válida e só então redireciona o professor para dentro do app —
 * assim o link só funciona uma vez e não expõe nenhum token na URL final.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      const url = new URL(next, origin);
      return NextResponse.redirect(url);
    }
  }

  // Link inválido, expirado ou já usado.
  const url = new URL("/recuperar-senha", origin);
  url.searchParams.set("erro", "link-invalido");
  return NextResponse.redirect(url);
}
