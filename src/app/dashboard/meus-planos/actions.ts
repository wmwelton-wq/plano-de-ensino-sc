"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Marca ou desmarca um plano como favorito ("em uso"). A segurança (só o dono altera) vem do RLS do banco. */
export async function alternarFavorito(tipo: "mensais" | "anuais", planoId: string, favorito: boolean): Promise<boolean> {
  if (!UUID.test(planoId)) return false;
  const supabase = await createClient();
  const tabela = tipo === "anuais" ? "planos_anuais" : "planos_de_ensino";
  const { error } = await supabase.from(tabela).update({ favorito }).eq("id", planoId);
  if (error) return false;
  revalidatePath("/dashboard", "layout");
  return true;
}
