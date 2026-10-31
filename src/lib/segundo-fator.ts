/**
 * Segunda etapa do login (2FA) — parte de servidor para o código por e-mail e para a chave de segurança USB.
 * (O app autenticador usa o recurso nativo do Supabase direto no navegador.)
 *
 * Como é protegido:
 *  - Os desafios, as chaves e o "esta sessão já passou pela segunda etapa" ficam em tabelas que o navegador
 *    NÃO consegue ler nem gravar. Só este código, no servidor, com a chave secreta (SUPABASE_SECRET_KEY).
 *  - Toda função aqui confere antes, com a sessão do próprio usuário, quem está pedindo.
 *  - O banco só libera as funções de administrador (eh_admin) para sessões marcadas como verificadas.
 */
import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { criarClienteServico } from "@/lib/supabase/admin";
import { enviarEmail, envioDeEmailAtivo } from "@/lib/email/resend";
import { ErroWebAuthn, verificarAssercao, verificarRegistro, type JwkPublica } from "@/lib/webauthn";

export type Resultado<T = object> = ({ ok: true } & T) | { ok?: false; erro: string };

const VALIDADE_CODIGO_MIN = 10;
const VALIDADE_DESAFIO_CHAVE_MIN = 5;
const VALIDADE_SESSAO_DIAS = 30;
const TENTATIVAS_MAX = 5;
const SEM_CHAVE = "A chave segura do servidor ainda não foi configurada na Vercel (SUPABASE_SECRET_KEY). Veja o aviso na página.";

interface Contexto {
  userId: string;
  email: string;
  sessaoId: string;
  servico: SupabaseClient;
  admin: boolean;
  rpId: string;
  origem: string;
}

function sha256Hex(texto: string): string {
  return createHash("sha256").update(texto).digest("hex");
}

function destinoWebAuthn(h: Headers): { rpId: string; origem: string } | null {
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim().toLowerCase();
  const nome = host.replace(/:\d+$/, "");
  const doSite = nome === "planodocente.com.br" || nome.endsWith(".planodocente.com.br");
  const permitido = doSite || nome.endsWith(".vercel.app") || nome === "localhost";
  if (!permitido) return null;
  const protocolo = nome === "localhost" ? "http" : "https";
  return { rpId: doSite ? "planodocente.com.br" : nome, origem: `${protocolo}://${host}` };
}

/** Quem está pedindo? (precisa estar logado; não exige que a segunda etapa já tenha passado.) */
async function contexto(): Promise<Resultado<{ c: Contexto }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { erro: "Sua sessão expirou. Entre de novo." };
  const servico = criarClienteServico();
  if (!servico) return { erro: SEM_CHAVE };
  const { data: sessao } = await supabase.rpc("sf_sessao_atual");
  if (typeof sessao !== "string") return { erro: "Não foi possível identificar a sessão. Entre de novo." };
  const alvo = destinoWebAuthn(await headers());
  const { data: admin } = await supabase.rpc("eh_admin");
  return { ok: true, c: { userId: user.id, email: user.email, sessaoId: sessao, servico, admin: admin === true, rpId: alvo?.rpId ?? "", origem: alvo?.origem ?? "" } };
}

async function marcarSessaoVerificada(c: Contexto, metodo: "email" | "chave"): Promise<void> {
  const expira = new Date(Date.now() + VALIDADE_SESSAO_DIAS * 86400_000).toISOString();
  await c.servico.from("sf_sessoes").delete().eq("user_id", c.userId).lt("expira_em", new Date().toISOString());
  await c.servico.from("sf_sessoes").upsert({ session_id: c.sessaoId, user_id: c.userId, metodo, expira_em: expira });
}

// =====================================================================
// Código por e-mail
// =====================================================================
export async function enviarCodigoEmail(modo: "login" | "ativar"): Promise<Resultado> {
  const r = await contexto();
  if (!r.ok) return r;
  const c = r.c;
  if (!envioDeEmailAtivo()) return { erro: "O envio de e-mail (Resend) ainda não está configurado, então não dá para usar o código por e-mail." };

  if (modo === "ativar") {
    if (!c.admin) return { erro: "Apenas o administrador pode ativar a verificação em duas etapas." };
  } else {
    const { data: cfg } = await c.servico.from("sf_config").select("email_ativo").eq("user_id", c.userId).maybeSingle();
    if (!cfg?.email_ativo) return { erro: "O código por e-mail não está ativado para esta conta." };
  }

  const tipo = modo === "ativar" ? "email_ativar" : "email_login";
  const agora = Date.now();
  const { data: recentes } = await c.servico
    .from("sf_desafios")
    .select("criado_em")
    .eq("user_id", c.userId)
    .in("tipo", ["email_ativar", "email_login"])
    .gte("criado_em", new Date(agora - 3600_000).toISOString())
    .order("criado_em", { ascending: false });
  if ((recentes?.length ?? 0) >= 6) return { erro: "Muitos códigos pedidos em pouco tempo. Aguarde um pouco e tente de novo." };
  if (recentes?.[0] && agora - new Date(recentes[0].criado_em as string).getTime() < 60_000) return { erro: "Aguarde 1 minuto para pedir outro código." };

  const codigo = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const sal = randomBytes(16).toString("hex");
  await c.servico.from("sf_desafios").update({ usado: true }).eq("user_id", c.userId).eq("usado", false).in("tipo", ["email_ativar", "email_login"]);
  const { data: criado, error } = await c.servico
    .from("sf_desafios")
    .insert({ user_id: c.userId, tipo, valor: sha256Hex(sal + codigo), sal, expira_em: new Date(agora + VALIDADE_CODIGO_MIN * 60_000).toISOString() })
    .select("id")
    .single();
  if (error || !criado) return { erro: "Não foi possível gerar o código agora." };

  const envio = await enviarEmail({
    para: c.email,
    assunto: "Seu código de verificação — Plano Docente",
    texto: `Seu código de verificação é ${codigo}. Ele vale por ${VALIDADE_CODIGO_MIN} minutos. Se não foi você, ignore este e-mail e troque sua senha.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;color:#0f172a"><h2 style="margin:0 0 8px">Seu código de verificação</h2><p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:16px 0">${codigo}</p><p>Ele vale por ${VALIDADE_CODIGO_MIN} minutos. Se não foi você quem pediu, ignore este e-mail e troque sua senha.</p><p style="color:#64748b;font-size:12px">Plano Docente</p></div>`,
  });
  if (!envio.ok) {
    await c.servico.from("sf_desafios").update({ usado: true }).eq("id", criado.id);
    return { erro: "Não foi possível enviar o e-mail agora. Tente de novo em instantes." };
  }
  return { ok: true };
}

export async function confirmarCodigoEmail(codigoBruto: string, modo: "login" | "ativar"): Promise<Resultado> {
  const r = await contexto();
  if (!r.ok) return r;
  const c = r.c;
  const codigo = (codigoBruto ?? "").replace(/\D/g, "");
  if (codigo.length !== 6) return { erro: "Digite os 6 números do código." };
  if (modo === "ativar" && !c.admin) return { erro: "Apenas o administrador pode ativar a verificação em duas etapas." };

  const tipo = modo === "ativar" ? "email_ativar" : "email_login";
  const { data: d } = await c.servico
    .from("sf_desafios")
    .select("id, valor, sal, tentativas")
    .eq("user_id", c.userId)
    .eq("tipo", tipo)
    .eq("usado", false)
    .gt("expira_em", new Date().toISOString())
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!d) return { erro: "O código expirou ou não foi pedido. Peça um novo." };
  if ((d.tentativas as number) >= TENTATIVAS_MAX) return { erro: "Muitas tentativas erradas. Peça um novo código." };

  // Conta a tentativa de forma atômica: só uma de várias requisições simultâneas consegue gastar a mesma tentativa.
  const { data: gasta } = await c.servico
    .from("sf_desafios")
    .update({ tentativas: (d.tentativas as number) + 1 })
    .eq("id", d.id)
    .eq("tentativas", d.tentativas as number)
    .select("id");
  if (!gasta || gasta.length !== 1) return { erro: "Não foi possível conferir o código agora. Tente de novo." };
  const esperado = Buffer.from(d.valor as string, "hex");
  const recebido = Buffer.from(sha256Hex((d.sal as string) + codigo), "hex");
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return { erro: "Código incorreto." };

  await c.servico.from("sf_desafios").update({ usado: true }).eq("id", d.id);
  if (modo === "ativar") {
    await c.servico.from("sf_config").upsert({ user_id: c.userId, email_ativo: true, atualizado_em: new Date().toISOString() });
  }
  await marcarSessaoVerificada(c, "email");
  return { ok: true };
}

export async function desativarEmail(): Promise<Resultado> {
  const r = await contexto();
  if (!r.ok) return r;
  if (!r.c.admin) return { erro: "Confirme sua identidade na segunda etapa antes de mudar estas opções." };
  await r.c.servico.from("sf_config").upsert({ user_id: r.c.userId, email_ativo: false, atualizado_em: new Date().toISOString() });
  return { ok: true };
}

// =====================================================================
// Chave de segurança (WebAuthn)
// =====================================================================
function aleatorioB64(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export async function opcoesRegistroChave(): Promise<Resultado<{ opcoes: Record<string, unknown> }>> {
  const r = await contexto();
  if (!r.ok) return r;
  const c = r.c;
  if (!c.admin) return { erro: "Apenas o administrador pode cadastrar chaves de segurança." };
  if (!c.rpId) return { erro: "Este endereço do site não permite chaves de segurança. Use planodocente.com.br." };
  const { data: existentes } = await c.servico.from("sf_chaves").select("credential_id").eq("user_id", c.userId).eq("rp_id", c.rpId);
  if ((existentes?.length ?? 0) >= 5) return { erro: "Limite de 5 chaves por conta. Remova uma antes de cadastrar outra." };

  const desafio = aleatorioB64();
  await c.servico.from("sf_desafios").insert({ user_id: c.userId, tipo: "chave_registro", valor: desafio, expira_em: new Date(Date.now() + VALIDADE_DESAFIO_CHAVE_MIN * 60_000).toISOString() });
  return {
    ok: true,
    opcoes: {
      challenge: desafio,
      rp: { id: c.rpId, name: "Plano Docente" },
      user: { id: Buffer.from(c.userId.replace(/-/g, ""), "hex").toString("base64url"), name: c.email, displayName: c.email },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: { residentKey: "discouraged", userVerification: "discouraged" },
      attestation: "none",
      timeout: 120000,
      excludeCredentials: (existentes ?? []).map((e) => ({ type: "public-key", id: e.credential_id })),
    },
  };
}

export async function concluirRegistroChave(resposta: { clientDataJSON: string; attestationObject: string }, nome: string): Promise<Resultado> {
  const r = await contexto();
  if (!r.ok) return r;
  const c = r.c;
  if (!c.admin || !c.rpId) return { erro: "Não autorizado." };
  const { data: d } = await c.servico
    .from("sf_desafios")
    .select("id, valor")
    .eq("user_id", c.userId)
    .eq("tipo", "chave_registro")
    .eq("usado", false)
    .gt("expira_em", new Date().toISOString())
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!d) return { erro: "O pedido expirou. Tente cadastrar de novo." };
  await c.servico.from("sf_desafios").update({ usado: true }).eq("id", d.id);
  try {
    const v = verificarRegistro({ clientDataJSON: resposta.clientDataJSON, attestationObject: resposta.attestationObject, desafio: d.valor as string, origensPermitidas: [c.origem], rpId: c.rpId });
    const rotulo = (nome ?? "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 40) || "Chave de segurança";
    const { error } = await c.servico.from("sf_chaves").insert({ user_id: c.userId, credential_id: v.credencialId, chave_publica: v.chavePublica, alg: v.alg, rp_id: c.rpId, contador: v.contador, nome: rotulo });
    if (error) return { erro: "Esta chave já está cadastrada." };
    await marcarSessaoVerificada(c, "chave"); // acabou de provar a posse da chave: não precisa repetir agora
    return { ok: true };
  } catch (e) {
    return { erro: e instanceof ErroWebAuthn ? `Não foi possível validar a chave: ${e.message}.` : "Não foi possível validar a chave." };
  }
}

export async function opcoesLoginChave(): Promise<Resultado<{ opcoes: Record<string, unknown> }>> {
  const r = await contexto();
  if (!r.ok) return r;
  const c = r.c;
  if (!c.rpId) return { erro: "Este endereço do site não permite chaves de segurança. Use planodocente.com.br." };
  const { data: chaves } = await c.servico.from("sf_chaves").select("credential_id").eq("user_id", c.userId).eq("rp_id", c.rpId);
  if (!chaves || chaves.length === 0) return { erro: "Nenhuma chave cadastrada para este endereço do site." };
  const desafio = aleatorioB64();
  await c.servico.from("sf_desafios").insert({ user_id: c.userId, tipo: "chave_login", valor: desafio, expira_em: new Date(Date.now() + VALIDADE_DESAFIO_CHAVE_MIN * 60_000).toISOString() });
  return {
    ok: true,
    opcoes: {
      challenge: desafio,
      rpId: c.rpId,
      timeout: 120000,
      userVerification: "discouraged",
      allowCredentials: chaves.map((k) => ({ type: "public-key", id: k.credential_id })),
    },
  };
}

export async function concluirLoginChave(resposta: { id: string; clientDataJSON: string; authenticatorData: string; assinatura: string }): Promise<Resultado> {
  const r = await contexto();
  if (!r.ok) return r;
  const c = r.c;
  if (!c.rpId) return { erro: "Endereço do site não permitido." };
  const { data: d } = await c.servico
    .from("sf_desafios")
    .select("id, valor")
    .eq("user_id", c.userId)
    .eq("tipo", "chave_login")
    .eq("usado", false)
    .gt("expira_em", new Date().toISOString())
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!d) return { erro: "O pedido expirou. Tente de novo." };
  await c.servico.from("sf_desafios").update({ usado: true }).eq("id", d.id);

  const { data: chave } = await c.servico.from("sf_chaves").select("id, chave_publica, alg, contador").eq("user_id", c.userId).eq("credential_id", resposta.id).eq("rp_id", c.rpId).maybeSingle();
  if (!chave) return { erro: "Esta chave não está cadastrada nesta conta." };
  try {
    const v = verificarAssercao({
      clientDataJSON: resposta.clientDataJSON,
      authenticatorData: resposta.authenticatorData,
      assinatura: resposta.assinatura,
      desafio: d.valor as string,
      origensPermitidas: [c.origem],
      rpId: c.rpId,
      chavePublica: chave.chave_publica as JwkPublica,
      alg: chave.alg as number,
      contadorAnterior: Number(chave.contador),
    });
    await c.servico.from("sf_chaves").update({ contador: v.contador, ultimo_uso: new Date().toISOString() }).eq("id", chave.id);
    await marcarSessaoVerificada(c, "chave");
    return { ok: true };
  } catch (e) {
    return { erro: e instanceof ErroWebAuthn ? `Não foi possível validar a chave: ${e.message}.` : "Não foi possível validar a chave." };
  }
}

export async function removerChave(id: string): Promise<Resultado> {
  const r = await contexto();
  if (!r.ok) return r;
  if (!r.c.admin) return { erro: "Confirme sua identidade na segunda etapa antes de mudar estas opções." };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { erro: "Chave inválida." };
  await r.c.servico.from("sf_chaves").delete().eq("id", id).eq("user_id", r.c.userId);
  return { ok: true };
}

/** Lista das chaves e do e-mail para a tela de configuração (só nomes e datas, nunca chave pública). */
export async function resumoSegundaEtapa(): Promise<Resultado<{ chaves: { id: string; nome: string; criado_em: string; ultimo_uso: string | null; rp_id: string }[]; emailAtivo: boolean }>> {
  const r = await contexto();
  if (!r.ok) return r;
  const c = r.c;
  const [{ data: chaves }, { data: cfg }] = await Promise.all([
    c.servico.from("sf_chaves").select("id, nome, criado_em, ultimo_uso, rp_id").eq("user_id", c.userId).order("criado_em"),
    c.servico.from("sf_config").select("email_ativo").eq("user_id", c.userId).maybeSingle(),
  ]);
  return { ok: true, chaves: (chaves ?? []) as never, emailAtivo: cfg?.email_ativo === true };
}
