"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface EstadoOpiniao {
  erro?: string;
  ok?: boolean;
}

function nota(v: FormDataEntryValue | null): number | null {
  const n = typeof v === "string" ? Number(v) : NaN;
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

export async function enviarOpiniao(_anterior: EstadoOpiniao, formData: FormData): Promise<EstadoOpiniao> {
  const geral = nota(formData.get("nota"));
  if (geral === null) return { erro: "Escolha uma nota de 1 a 5 para a pergunta 1." };
  const facilidade = nota(formData.get("facilidade"));
  const bruto = formData.get("comentario");
  const comentario = typeof bruto === "string" ? bruto.trim().slice(0, 2000) : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre novamente." };

  const { error } = await supabase
    .from("pesquisas_satisfacao")
    .insert({ professor_id: user.id, nota: geral, facilidade, comentario: comentario || null });
  if (error) return { erro: "Não foi possível enviar agora. Tente novamente em instantes." };

  revalidatePath("/dashboard/opiniao");
  return { ok: true };
}
