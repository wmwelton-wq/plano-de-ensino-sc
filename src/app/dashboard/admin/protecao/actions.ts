"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Muda os tetos do disjuntor e os limites de ritmo por professor. Só administrador (conferido no banco). */
export async function configurarProtecao(gastoHora: number, chamadasHora: number, usuarioMinuto: number, usuarioHora: number): Promise<{ ok?: true; erro?: string }> {
  if (![gastoHora, chamadasHora, usuarioMinuto, usuarioHora].every((n) => Number.isFinite(n))) return { erro: "Digite números válidos." };
  if (gastoHora < 0.01 || gastoHora > 10000) return { erro: "O teto de gasto por hora deve ficar entre 0,01 e 10.000." };
  if (chamadasHora < 5 || chamadasHora > 100000) return { erro: "O teto de chamadas por hora deve ficar entre 5 e 100.000." };
  if (usuarioMinuto < 1 || usuarioMinuto > 100) return { erro: "O limite por minuto deve ficar entre 1 e 100." };
  if (usuarioHora < 1 || usuarioHora > 1000) return { erro: "O limite por hora deve ficar entre 1 e 1.000." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_protecao_configurar", {
    p_gasto_hora: gastoHora,
    p_chamadas_hora: Math.round(chamadasHora),
    p_usuario_min: Math.round(usuarioMinuto),
    p_usuario_hora: Math.round(usuarioHora),
  });
  if (error) return { erro: "Não foi possível salvar agora." };
  revalidatePath("/dashboard/admin/protecao");
  return { ok: true };
}

/** Religa a IA depois que o disjuntor disparou (zera a contagem da hora para não disparar de novo na hora). */
export async function religarIA(): Promise<{ ok?: true; erro?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_ia_configurar", { p_habilitada: true, p_limite: null });
  if (error) return { erro: "Não foi possível religar agora." };
  revalidatePath("/dashboard/admin/protecao");
  revalidatePath("/dashboard/admin/ia");
  return { ok: true };
}
