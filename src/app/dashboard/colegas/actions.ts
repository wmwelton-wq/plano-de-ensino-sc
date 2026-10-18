"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { enviarEmail, envioDeEmailAtivo } from "@/lib/email/resend";
import { montarEmailPlano } from "@/lib/email/modelo-plano";

export interface Colega {
  id: string;
  nome: string;
  email: string;
}

export interface EstadoColega {
  erro?: string;
  ok?: boolean;
  colega?: Colega;
}

const EMAIL = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;

function texto(formData: FormData, nome: string, max: number): string {
  const v = formData.get(nome);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Colegas cadastrados pelo professor (só os dele: a regra do banco impede ver os de outros). */
export async function listarColegas(): Promise<Colega[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("contatos_professores").select("id, nome, email").order("nome", { ascending: true });
  return (data ?? []) as Colega[];
}

/** Cadastra ou edita um colega (nome + e-mail). */
export async function salvarColega(_anterior: EstadoColega, formData: FormData): Promise<EstadoColega> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Faça login novamente." };

  const id = texto(formData, "id", 60);
  const nome = texto(formData, "nome", 120);
  const email = texto(formData, "email", 254).toLowerCase();
  if (!nome) return { erro: "Escreva o nome do colega." };
  if (!EMAIL.test(email)) return { erro: "Confira o e-mail: ele precisa ter o formato nome@exemplo.com." };

  if (id) {
    const { data, error } = await supabase.from("contatos_professores").update({ nome, email }).eq("id", id).select("id, nome, email").single();
    if (error || !data) {
      if (error?.code === "23505") return { erro: "Você já cadastrou este e-mail." };
      return { erro: "Não foi possível salvar. Tente novamente." };
    }
    revalidatePath("/dashboard/colegas");
    return { ok: true, colega: data as Colega };
  }

  const { data, error } = await supabase.from("contatos_professores").insert({ professor_id: user.id, nome, email }).select("id, nome, email").single();
  if (error || !data) {
    if (error?.code === "23505") return { erro: "Você já cadastrou este e-mail." };
    if (error?.message?.includes("limite_contatos")) return { erro: "Você chegou ao limite de 50 colegas. Exclua algum para cadastrar outro." };
    return { erro: "Não foi possível salvar. Tente novamente." };
  }
  revalidatePath("/dashboard/colegas");
  return { ok: true, colega: data as Colega };
}

export async function excluirColega(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("contatos_professores").delete().eq("id", id);
  revalidatePath("/dashboard/colegas");
}

export interface PedidoEnvio {
  /** Código do link de leitura já criado (o PDF é gerado no navegador e guardado antes). */
  token: string;
  colegaIds: string[];
  mensagem: string;
}

export interface ResultadoEnvio {
  erro?: string;
  enviados: string[];
  falhas: { nome: string; motivo: string }[];
}

const MOTIVOS: Record<string, string> = {
  limite_dia: "Você chegou ao limite de 20 e-mails em 24 horas. Tente de novo amanhã.",
  limite_mes: "Você chegou ao limite de 200 e-mails em 30 dias.",
  sessao: "Sessão expirada. Faça login novamente.",
};

async function enderecoDoSite(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://planodocente.com.br").replace(/\/$/, "");
}

/** Envia por e-mail o link de leitura de um plano para os colegas escolhidos. */
export async function enviarPlanoPorEmail(pedido: PedidoEnvio): Promise<ResultadoEnvio> {
  const vazio: ResultadoEnvio = { enviados: [], falhas: [] };
  if (!envioDeEmailAtivo()) {
    return { ...vazio, erro: "O envio por e-mail ainda não foi ativado neste sistema. Enquanto isso, use “Copiar link” ou o WhatsApp." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...vazio, erro: "Sessão expirada. Faça login novamente." };

  if (!/^[A-Za-z0-9_-]{24,64}$/.test(pedido.token)) return { ...vazio, erro: "Link inválido. Crie o link de leitura de novo." };
  const ids = Array.from(new Set(pedido.colegaIds.filter((x) => typeof x === "string" && x.length <= 60))).slice(0, 10);
  if (ids.length === 0) return { ...vazio, erro: "Escolha pelo menos um colega." };

  // O link precisa ser do próprio professor e ainda estar valendo (a regra do banco só mostra os dele).
  const { data: link } = await supabase
    .from("plano_compartilhamentos")
    .select("titulo, expira_em")
    .eq("token", pedido.token)
    .gt("expira_em", new Date().toISOString())
    .maybeSingle();
  if (!link) return { ...vazio, erro: "O link de leitura não existe mais. Crie o link de novo e tente outra vez." };

  const { data: colegas } = await supabase.from("contatos_professores").select("id, nome, email").in("id", ids);
  const lista = (colegas ?? []) as Colega[];
  if (lista.length === 0) return { ...vazio, erro: "Não encontrei os colegas escolhidos." };

  const { data: perfil } = await supabase.from("professores").select("nome").eq("id", user.id).maybeSingle();
  const nomeRemetente = (perfil as { nome: string | null } | null)?.nome?.trim() || "Um professor";
  const endereco = `${await enderecoDoSite()}/p/${pedido.token}`;
  const validoAte = new Date(link.expira_em as string).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const mensagem = (pedido.mensagem ?? "").slice(0, 500);

  const resultado: ResultadoEnvio = { enviados: [], falhas: [] };
  for (const colega of lista) {
    const { data: reserva } = await supabase.rpc("email_reservar_envio", { p_destinatario: colega.email });
    const r = reserva as { ok?: boolean; id?: string; motivo?: string } | null;
    if (!r?.ok || !r.id) {
      const motivo = MOTIVOS[r?.motivo ?? ""] ?? "Não foi possível enviar agora.";
      resultado.falhas.push({ nome: colega.nome, motivo });
      if (r?.motivo === "limite_dia" || r?.motivo === "limite_mes" || r?.motivo === "sessao") break;
      continue;
    }
    const modelo = montarEmailPlano({ nomeRemetente, nomeDestinatario: colega.nome, tituloPlano: link.titulo as string, link: endereco, validoAte, mensagem });
    const envio = await enviarEmail({ para: colega.email, assunto: modelo.assunto, html: modelo.html, texto: modelo.texto, responderPara: user.email ?? undefined });
    await supabase.rpc("email_finalizar_envio", { p_id: r.id, p_ok: envio.ok });
    if (envio.ok) resultado.enviados.push(colega.nome);
    else {
      console.error("[email] falha no envio", envio.motivo, envio.detalhe ?? "");
      resultado.falhas.push({
        nome: colega.nome,
        motivo: envio.motivo === "desativado" ? "Envio por e-mail desativado." : "O serviço de e-mail não aceitou o envio. Tente de novo em instantes.",
      });
    }
  }
  return resultado;
}

/** Diz se o envio por e-mail já foi ativado no sistema (chave do Resend configurada). */
export async function envioPorEmailAtivo(): Promise<boolean> {
  return envioDeEmailAtivo();
}
