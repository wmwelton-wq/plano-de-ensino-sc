"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Administrador muda a situação de um aviso "Faltou algo?" e deixa uma anotação (a regra de acesso é conferida no banco). */
export async function atualizarSugestao(id: string, status: string, nota: string): Promise<{ ok?: true; erro?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_atualizar_sugestao", { p_id: id, p_status: status, p_nota: nota });
  if (error) return { erro: "Não foi possível salvar agora." };
  revalidatePath("/dashboard/admin");
  return { ok: true };
}
