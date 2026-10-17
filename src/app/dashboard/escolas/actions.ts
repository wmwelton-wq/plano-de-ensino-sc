"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface EstadoFormularioEscola {
  erro?: string;
}

const BUCKET_LOGOS = "logos-escolas";

// Whitelist de tipos aceitos: nunca confiamos no nome do arquivo enviado pelo
// navegador (o atributo "accept" do <input> é apenas uma dica de UI, não uma
// validação de segurança) — o content-type real e a extensão usada no Storage
// são sempre derivados deste mapa, nunca do nome original do arquivo.
const TIPOS_LOGO_PERMITIDOS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const TAMANHO_MAXIMO_LOGO = 2 * 1024 * 1024; // 2 MB

/** Confere o conteúdo REAL do arquivo (os primeiros bytes), não só o tipo que o navegador declarou. */
function conteudoCombinaComTipo(tipo: string, bytes: Uint8Array, texto: string): boolean {
  const ini = (...b: number[]) => b.every((v, i) => bytes[i] === v);
  switch (tipo) {
    case "image/png":
      return ini(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case "image/jpeg":
      return ini(0xff, 0xd8, 0xff);
    case "image/webp":
      return ini(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    case "image/svg+xml": {
      // SVG é XML e pode carregar scripts: aceita só se for um SVG "limpo".
      const t = texto.toLowerCase();
      if (!t.includes("<svg")) return false;
      return !/<script|<foreignobject|<iframe|<embed|<object|javascript:|\bon[a-z]+\s*=|<!entity|<!doctype[^>]*\[/.test(t);
    }
    default:
      return false;
  }
}

type ResultadoUploadLogo =
  | { ok: true; url: string | null }
  | { ok: false; erro: string };

async function enviarLogo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  arquivo: File
): Promise<ResultadoUploadLogo> {
  if (!arquivo || arquivo.size === 0) {
    return { ok: true, url: null };
  }

  const extensao = TIPOS_LOGO_PERMITIDOS[arquivo.type];
  if (!extensao) {
    return {
      ok: false,
      erro: "Formato de imagem não suportado. Envie um arquivo PNG, JPEG, WEBP ou SVG.",
    };
  }

  if (arquivo.size > TAMANHO_MAXIMO_LOGO) {
    return { ok: false, erro: "A logo deve ter no máximo 2 MB." };
  }

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const texto = arquivo.type === "image/svg+xml" ? new TextDecoder().decode(bytes) : "";
  if (!conteudoCombinaComTipo(arquivo.type, bytes, texto)) {
    return { ok: false, erro: "O arquivo não parece ser uma imagem válida. Envie um PNG, JPEG, WEBP ou SVG simples." };
  }

  // Caminho prefixado pelo userId (auth.uid()) — as policies do bucket
  // "logos-escolas" só permitem insert/update/delete dentro da própria pasta,
  // garantindo que um professor nunca sobrescreva o arquivo de outro.
  const caminho = `${userId}/${crypto.randomUUID()}.${extensao}`;

  const { error } = await supabase.storage
    .from(BUCKET_LOGOS)
    .upload(caminho, bytes, { upsert: true, contentType: arquivo.type });

  if (error) {
    return { ok: false, erro: "Não foi possível enviar a logo. Tente novamente." };
  }

  const { data } = supabase.storage.from(BUCKET_LOGOS).getPublicUrl(caminho);
  return { ok: true, url: data.publicUrl };
}

export async function criarEscola(
  _estadoAnterior: EstadoFormularioEscola,
  formData: FormData
): Promise<EstadoFormularioEscola> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erro: "Sessão expirada. Faça login novamente." };
  }

  const nome = formData.get("nome") as string;
  const municipio = formData.get("municipio") as string;
  const logoArquivo = formData.get("logo") as File | null;

  if (!nome || !municipio) {
    return { erro: "Preencha o nome da escola e o município." };
  }

  let logoUrl: string | null = null;
  if (logoArquivo && logoArquivo.size > 0) {
    const resultado = await enviarLogo(supabase, user.id, logoArquivo);
    if (!resultado.ok) {
      return { erro: resultado.erro };
    }
    logoUrl = resultado.url;
  }

  const { error } = await supabase.from("escolas").insert({
    professor_id: user.id,
    nome,
    municipio,
    logo_url: logoUrl,
  });

  if (error) {
    return { erro: "Não foi possível salvar a escola. Tente novamente." };
  }

  revalidatePath("/dashboard/escolas");
  redirect("/dashboard/escolas");
}

export async function atualizarEscola(
  escolaId: string,
  _estadoAnterior: EstadoFormularioEscola,
  formData: FormData
): Promise<EstadoFormularioEscola> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erro: "Sessão expirada. Faça login novamente." };
  }

  const nome = formData.get("nome") as string;
  const municipio = formData.get("municipio") as string;
  const logoArquivo = formData.get("logo") as File | null;

  if (!nome || !municipio) {
    return { erro: "Preencha o nome da escola e o município." };
  }

  let novaLogoUrl: string | undefined;
  if (logoArquivo && logoArquivo.size > 0) {
    const resultado = await enviarLogo(supabase, user.id, logoArquivo);
    if (!resultado.ok) {
      return { erro: resultado.erro };
    }
    novaLogoUrl = resultado.url ?? undefined;
  }

  const { error } = await supabase
    .from("escolas")
    .update({
      nome,
      municipio,
      updated_at: new Date().toISOString(),
      ...(novaLogoUrl !== undefined ? { logo_url: novaLogoUrl } : {}),
    })
    .eq("id", escolaId);

  if (error) {
    return { erro: "Não foi possível salvar as alterações. Tente novamente." };
  }

  revalidatePath("/dashboard/escolas");
  redirect("/dashboard/escolas");
}

export async function excluirEscola(escolaId: string) {
  const supabase = await createClient();
  await supabase.from("escolas").delete().eq("id", escolaId);
  revalidatePath("/dashboard/escolas");
  redirect("/dashboard/escolas");
}
