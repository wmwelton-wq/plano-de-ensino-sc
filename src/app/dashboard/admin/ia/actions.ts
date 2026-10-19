"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { testarProvedores, type ResultadoTeste } from "@/lib/ia/provedores";

/** Teste rápido de cada IA configurada. Só administrador (conferido no banco). */
export async function testarIAs(): Promise<{ resultados?: ResultadoTeste[]; erro?: string }> {
  const supabase = await createClient();
  const { data: ehAdmin } = await supabase.rpc("eh_admin");
  if (ehAdmin !== true) return { erro: "Acesso negado." };
  return { resultados: await testarProvedores() };
}

/** Liga/desliga a IA para todos e/ou muda o limite de gasto mensal (em dólares). */
export async function configurarIA(habilitada: boolean | null, limite: number | null): Promise<{ ok?: true; erro?: string }> {
  if (limite !== null && (!Number.isFinite(limite) || limite < 0 || limite > 100000)) return { erro: "Limite inválido." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_ia_configurar", { p_habilitada: habilitada, p_limite: limite });
  if (error) return { erro: "Não foi possível salvar agora." };
  revalidatePath("/dashboard/admin/ia");
  return { ok: true };
}
