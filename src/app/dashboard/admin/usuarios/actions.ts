"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { criarClienteServico } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

type Retorno = { ok?: true; erro?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BUCKETS = ["compartilhados", "logos-escolas"] as const;

function traduzir(mensagem: string | undefined): string {
  const m = (mensagem ?? "").toLowerCase();
  if (m.includes("acesso negado")) return "Sem permissão. Confirme a verificação em duas etapas e tente de novo.";
  if (m.includes("a si mesmo")) return "Você não pode fazer isso com a sua própria conta.";
  if (m.includes("administrador")) return "Não é possível fazer isso com uma conta de administração.";
  if (m.includes("nao encontrado")) return "Usuário não encontrado (talvez já tenha sido excluído).";
  if (m.includes("confirmacao")) return "O e-mail digitado não confere com o da conta.";
  return "Não foi possível concluir agora. Tente de novo.";
}

/** Bloqueia ou libera um usuário (o banco confere se quem pede é administrador e deixa o registro da ação). */
export async function acaoBloquearUsuario(id: string, bloquear: boolean): Promise<Retorno> {
  if (!UUID.test(id)) return { erro: "Usuário inválido." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_bloquear_usuario", { p_id: id, p_bloquear: bloquear === true });
  if (error) return { erro: traduzir(error.message) };
  revalidatePath("/dashboard/admin/usuarios");
  return { ok: true };
}

/** Abre ou fecha os cadastros de novos usuários. */
export async function acaoDefinirCadastros(abertos: boolean): Promise<Retorno> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_definir_cadastros", { p_abertos: abertos === true });
  if (error) return { erro: traduzir(error.message) };
  revalidatePath("/dashboard/admin/usuarios");
  return { ok: true };
}

/** O e-mail de recuperação sai do navegador (precisa do CAPTCHA); aqui só deixamos o registro de que foi pedido. */
export async function acaoRegistrarRecuperacao(id: string): Promise<Retorno> {
  if (!UUID.test(id)) return { erro: "Usuário inválido." };
  const supabase = await createClient();
  const { data: admin } = await supabase.rpc("eh_admin");
  if (admin !== true) return { erro: "Sem permissão." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const servico = criarClienteServico();
  if (!servico || !user) return { ok: true }; // sem a chave do servidor o registro não é gravado, mas o e-mail já foi enviado
  const { data: alvo } = await servico.auth.admin.getUserById(id);
  await servico.from("admin_acoes_log").insert({ admin_id: user.id, acao: "enviar_recuperacao", alvo_id: id, alvo_email_mascarado: mascarar(alvo?.user?.email) });
  revalidatePath("/dashboard/admin/usuarios");
  return { ok: true };
}

function mascarar(email: string | undefined | null): string | null {
  if (!email) return null;
  const [nome, dominio] = email.split("@");
  if (!dominio) return null;
  return `${nome.slice(0, 2)}***@${dominio}`;
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

/**
 * Exclui a conta de um professor e tudo o que é dele (planos, escolas, arquivos...).
 * O banco confere primeiro: quem pede é administrador (com a segunda etapa), não é a própria conta, não é outro
 * administrador e o e-mail digitado confere. Só então usamos a chave do servidor.
 */
export async function acaoExcluirUsuario(id: string, emailConfirmacao: string): Promise<Retorno> {
  if (!UUID.test(id)) return { erro: "Usuário inválido." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const { data: emailAlvo, error: erroValidacao } = await supabase.rpc("admin_validar_exclusao", { p_id: id, p_email_confirmacao: String(emailConfirmacao ?? "") });
  if (erroValidacao || typeof emailAlvo !== "string") return { erro: traduzir(erroValidacao?.message) };

  const servico = criarClienteServico();
  if (!servico) return { erro: "A chave secreta do servidor (SUPABASE_SECRET_KEY) ainda não foi configurada na Vercel, por isso a exclusão está desligada." };

  // 1) tabelas que não apagam sozinhas junto com a conta
  await servico.from("pesquisas_satisfacao").delete().eq("professor_id", id);
  await servico.from("ai_seguranca_eventos").delete().eq("professor_id", id);
  // 2) arquivos enviados
  for (const bucket of BUCKETS) {
    try {
      await apagarPasta(servico, bucket, id);
    } catch {
      // se a limpeza de um arquivo falhar, seguimos: a conta e os dados principais são o que importa
    }
  }
  // 3) a conta (os planos, escolas etc. saem em cascata)
  const { error } = await servico.auth.admin.deleteUser(id);
  if (error) return { erro: "Não foi possível excluir a conta agora. Nada mais foi apagado além de respostas de pesquisa e arquivos." };

  await servico.from("admin_acoes_log").insert({ admin_id: user.id, acao: "excluir", alvo_id: null, alvo_email_mascarado: mascarar(emailAlvo) });
  revalidatePath("/dashboard/admin/usuarios");
  return { ok: true };
}
