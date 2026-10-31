"use server";

import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { criarClienteServico } from "@/lib/supabase/admin";
import { enviarEmail, envioDeEmailAtivo } from "@/lib/email/resend";

/**
 * Exclusão da própria conta, confirmada por um código enviado ao e-mail da conta.
 *
 * Como é protegido:
 *  - Quem pede é sempre o usuário da sessão (getUser); nunca recebemos um id vindo do navegador.
 *  - O código (6 números) vale 10 minutos, é guardado só como hash com sal, tem no máximo 5 tentativas e
 *    só pode ser pedido 3 vezes por hora (1 por minuto). A tabela não é legível pelo navegador.
 *  - Contas de administração não podem ser excluídas por aqui.
 *  - Só depois do código certo usamos a chave do servidor para apagar arquivos e a conta
 *    (planos, escolas etc. saem em cascata).
 */

type Retorno = { ok?: true; erro?: string };

const VALIDADE_MIN = 10;
const TENTATIVAS_MAX = 5;
const BUCKETS = ["compartilhados", "logos-escolas"] as const;
const SEM_CHAVE = "A exclusão de conta ainda não está disponível (configuração do servidor pendente). Escreva para contato@planodocente.com.br.";

function sha256Hex(texto: string): string {
  return createHash("sha256").update(texto).digest("hex");
}

async function quemPede(): Promise<{ id: string; email: string; servico: SupabaseClient } | { erro: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { erro: "Sua sessão expirou. Entre de novo." };
  const servico = criarClienteServico();
  if (!servico) return { erro: SEM_CHAVE };
  const { data: adm } = await servico.from("administradores").select("professor_id").eq("professor_id", user.id).maybeSingle();
  if (adm) return { erro: "Contas de administração não podem ser excluídas por aqui." };
  return { id: user.id, email: user.email, servico };
}

export async function enviarCodigoExclusao(): Promise<Retorno> {
  const q = await quemPede();
  if ("erro" in q) return { erro: q.erro };
  if (!envioDeEmailAtivo()) return { erro: "O envio de e-mail ainda não está configurado. Escreva para contato@planodocente.com.br para excluir a conta." };

  const agora = Date.now();
  const { data: recentes } = await q.servico
    .from("exclusao_conta_desafios")
    .select("criado_em")
    .eq("user_id", q.id)
    .gte("criado_em", new Date(agora - 3600_000).toISOString())
    .order("criado_em", { ascending: false });
  if ((recentes?.length ?? 0) >= 3) return { erro: "Muitos códigos pedidos em pouco tempo. Aguarde um pouco e tente de novo." };
  if (recentes?.[0] && agora - new Date(recentes[0].criado_em as string).getTime() < 60_000) return { erro: "Aguarde 1 minuto para pedir outro código." };

  const codigo = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const sal = randomBytes(16).toString("hex");
  await q.servico.from("exclusao_conta_desafios").update({ usado: true }).eq("user_id", q.id).eq("usado", false);
  const { data: criado, error } = await q.servico
    .from("exclusao_conta_desafios")
    .insert({ user_id: q.id, valor: sha256Hex(sal + codigo), sal, expira_em: new Date(agora + VALIDADE_MIN * 60_000).toISOString() })
    .select("id")
    .single();
  if (error || !criado) return { erro: "Não foi possível gerar o código agora. Tente de novo em instantes." };

  const envio = await enviarEmail({
    para: q.email,
    assunto: "Código para excluir sua conta — Plano Docente",
    texto: `Você pediu para excluir sua conta no Plano Docente. Para confirmar, digite o código ${codigo} (vale por ${VALIDADE_MIN} minutos). Atenção: todos os seus dados serão apagados e não podem ser recuperados. Se não foi você, ignore este e-mail e troque sua senha.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:440px;margin:auto;color:#0f172a"><h2 style="margin:0 0 8px">Código para excluir sua conta</h2><p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:16px 0">${codigo}</p><p>Ele vale por ${VALIDADE_MIN} minutos. Ao digitá-lo no site, sua conta e <strong>todos os seus dados serão apagados</strong> e não poderão ser recuperados.</p><p>Se não foi você quem pediu, ignore este e-mail e troque sua senha.</p><p style="color:#64748b;font-size:12px">Plano Docente</p></div>`,
  });
  if (!envio.ok) {
    await q.servico.from("exclusao_conta_desafios").update({ usado: true }).eq("id", criado.id);
    return { erro: "Não foi possível enviar o e-mail agora. Tente de novo em instantes." };
  }
  return { ok: true };
}

async function apagarPasta(servico: SupabaseClient, bucket: string, prefixo: string, profundidade = 0): Promise<void> {
  if (profundidade > 4) return;
  const { data } = await servico.storage.from(bucket).list(prefixo, { limit: 1000 });
  if (!data?.length) return;
  const arquivos: string[] = [];
  for (const item of data) {
    const caminho = `${prefixo}/${item.name}`;
    // Itens sem "id" são pastas.
    if (item.id) arquivos.push(caminho);
    else await apagarPasta(servico, bucket, caminho, profundidade + 1);
  }
  if (arquivos.length) await servico.storage.from(bucket).remove(arquivos);
}

export async function confirmarExclusaoConta(codigoBruto: string): Promise<Retorno> {
  const q = await quemPede();
  if ("erro" in q) return { erro: q.erro };
  const codigo = String(codigoBruto ?? "").replace(/\D/g, "");
  if (codigo.length !== 6) return { erro: "Digite os 6 números do código." };

  const { data: d } = await q.servico
    .from("exclusao_conta_desafios")
    .select("id, valor, sal, tentativas")
    .eq("user_id", q.id)
    .eq("usado", false)
    .gt("expira_em", new Date().toISOString())
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!d) return { erro: "O código expirou ou não foi pedido. Peça um novo." };
  if ((d.tentativas as number) >= TENTATIVAS_MAX) return { erro: "Muitas tentativas erradas. Peça um novo código." };

  // Conta a tentativa de forma atômica: só uma de várias requisições simultâneas consegue gastar a mesma tentativa.
  const { data: gasta } = await q.servico
    .from("exclusao_conta_desafios")
    .update({ tentativas: (d.tentativas as number) + 1 })
    .eq("id", d.id)
    .eq("tentativas", d.tentativas as number)
    .select("id");
  if (!gasta || gasta.length !== 1) return { erro: "Não foi possível conferir o código agora. Tente de novo." };
  const esperado = Buffer.from(d.valor as string, "hex");
  const recebido = Buffer.from(sha256Hex((d.sal as string) + codigo), "hex");
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return { erro: "Código incorreto." };
  await q.servico.from("exclusao_conta_desafios").update({ usado: true }).eq("id", d.id);

  // 1) tabelas que não apagam sozinhas junto com a conta
  await q.servico.from("pesquisas_satisfacao").delete().eq("professor_id", q.id);
  await q.servico.from("ai_seguranca_eventos").delete().eq("professor_id", q.id);
  // 2) arquivos enviados (logos e PDFs compartilhados)
  for (const bucket of BUCKETS) {
    try {
      await apagarPasta(q.servico, bucket, q.id);
    } catch {
      // se a limpeza de um arquivo falhar, seguimos: a conta e os dados principais são o que importa
    }
  }
  // 3) a conta (planos, escolas, turmas etc. saem em cascata)
  const { error } = await q.servico.auth.admin.deleteUser(q.id);
  if (error) return { erro: "Não foi possível excluir a conta agora. Tente de novo em instantes ou escreva para contato@planodocente.com.br." };

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // a sessão já não vale mais, pois a conta deixou de existir
  }
  return { ok: true };
}
