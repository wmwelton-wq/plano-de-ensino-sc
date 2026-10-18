import { createClient } from "@/lib/supabase/client";

const BUCKET = "compartilhados";
const MAX_LINKS_ATIVOS = 30;

export interface LinkCompartilhado {
  id: string;
  token: string;
  arquivo_path: string;
  expira_em: string;
}

export function enderecoDoLink(token: string): string {
  return `${window.location.origin}/p/${token}`;
}

function novoToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Link de leitura já criado para este plano (se ainda valer). */
export async function linkAtual(tipo: "mensal" | "anual", planoId: string): Promise<LinkCompartilhado | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("plano_compartilhamentos")
    .select("id, token, arquivo_path, expira_em")
    .eq("plano_tipo", tipo)
    .eq("plano_id", planoId)
    .gt("expira_em", new Date().toISOString())
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as LinkCompartilhado | null) ?? null;
}

async function apagar(linhas: { id: string; arquivo_path: string }[]) {
  if (linhas.length === 0) return;
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove(linhas.map((l) => l.arquivo_path));
  await supabase.from("plano_compartilhamentos").delete().in("id", linhas.map((l) => l.id));
}

/** Para de compartilhar: apaga o arquivo e o link. */
export async function pararDeCompartilhar(tipo: "mensal" | "anual", planoId: string): Promise<void> {
  const supabase = createClient();
  const { data } = await supabase.from("plano_compartilhamentos").select("id, arquivo_path").eq("plano_tipo", tipo).eq("plano_id", planoId);
  await apagar((data ?? []) as { id: string; arquivo_path: string }[]);
}

/**
 * Publica o PDF e devolve o link de leitura. Guarda só um link por plano (o novo substitui o antigo) e
 * limpa os vencidos, para não ocupar espaço à toa.
 */
export async function criarLinkDeLeitura(pdf: File, tipo: "mensal" | "anual", planoId: string, titulo: string): Promise<LinkCompartilhado> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Entre novamente.");
  if (pdf.size > 4 * 1024 * 1024) throw new Error("O PDF deste plano é grande demais para compartilhar (máximo de 4 MB).");

  const { data: existentes } = await supabase.from("plano_compartilhamentos").select("id, arquivo_path, plano_tipo, plano_id, expira_em");
  const lista = (existentes ?? []) as { id: string; arquivo_path: string; plano_tipo: string; plano_id: string; expira_em: string }[];
  const agora = Date.now();
  await apagar(lista.filter((l) => (l.plano_tipo === tipo && l.plano_id === planoId) || Date.parse(l.expira_em) <= agora));
  const restantes = lista.filter((l) => !(l.plano_tipo === tipo && l.plano_id === planoId) && Date.parse(l.expira_em) > agora);
  if (restantes.length >= MAX_LINKS_ATIVOS) throw new Error(`Você já tem ${MAX_LINKS_ATIVOS} links ativos. Pare de compartilhar algum plano antes.`);

  const token = novoToken();
  const caminho = `${user.id}/${token}.pdf`;
  const envio = await supabase.storage.from(BUCKET).upload(caminho, pdf, { contentType: "application/pdf", upsert: false, cacheControl: "3600" });
  if (envio.error) throw new Error("Não foi possível enviar o arquivo. Tente novamente.");

  const { data, error } = await supabase
    .from("plano_compartilhamentos")
    .insert({ professor_id: user.id, plano_tipo: tipo, plano_id: planoId, token, titulo: titulo.slice(0, 200), arquivo_path: caminho })
    .select("id, token, arquivo_path, expira_em")
    .single();
  if (error || !data) {
    await supabase.storage.from(BUCKET).remove([caminho]);
    throw new Error("Não foi possível criar o link. Tente novamente.");
  }
  return data as LinkCompartilhado;
}
