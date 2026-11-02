import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Volta do "Entrar com Google": troca o código por uma sessão e leva o professor ao painel.
 * Só aceita caminhos internos em "next" (nunca outro site).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextBruto = searchParams.get("next") ?? "/dashboard";
  // Tira tabulação/quebra de linha (o navegador as ignora e "/\t/site.com" viraria "//site.com") e confere que o destino é do próprio site.
  const limpo = nextBruto.replace(/[\u0000-\u001f\u007f]/g, "");
  let next = "/dashboard";
  if (limpo.startsWith("/") && !limpo.startsWith("//") && !limpo.includes("\\")) {
    try {
      if (new URL(limpo, origin).origin === origin) next = limpo;
    } catch {
      /* mantém /dashboard */
    }
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  const url = new URL("/login", origin);
  url.searchParams.set("erro", "google");
  return NextResponse.redirect(url);
}
