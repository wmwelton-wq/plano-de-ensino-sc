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
  const next = nextBruto.startsWith("/") && !nextBruto.startsWith("//") && !nextBruto.includes("\\") ? nextBruto : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  const url = new URL("/login", origin);
  url.searchParams.set("erro", "google");
  return NextResponse.redirect(url);
}
