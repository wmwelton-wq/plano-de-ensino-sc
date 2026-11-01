"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { anosParaEscolha, COOKIE_ANO, destinoSeguro, lerAno } from "@/lib/ano-competencia";
import { createClient } from "@/lib/supabase/server";

/** Grava o ano escolhido (cookie de sessão: some ao fechar o navegador ou sair) e leva o professor para onde ia. */
export async function escolherAnoCompetencia(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ano = lerAno(String(formData.get("ano") ?? ""));
  if (!ano || !anosParaEscolha().includes(ano)) redirect("/dashboard/ano");

  (await cookies()).set(COOKIE_ANO, String(ano), {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  redirect(destinoSeguro(String(formData.get("proximo") ?? "")));
}
