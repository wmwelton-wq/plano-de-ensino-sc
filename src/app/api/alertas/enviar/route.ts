import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enviarEmail, envioDeEmailAtivo } from "@/lib/email/resend";

/**
 * Envia por e-mail os alertas de segurança pendentes (tabela `alertas_seguranca`, no Supabase).
 *
 * Quem chama: o próprio banco (pg_net), na hora em que um alerta nasce e a cada 5 minutos (pg_cron).
 * A chamada leva um token interno gerado e guardado SÓ no banco (tabela `alertas_config`, sem acesso público).
 * Sem o token certo, as funções do banco não devolvem nada e a rota responde 401. Por isso a rota usa só a chave
 * pública (publishable) do Supabase: não depende de nenhuma chave secreta nova.
 *
 * Variáveis (somente servidor, Vercel): RESEND_API_KEY (já existe); ALERTAS_EMAIL_DESTINO (opcional).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DESTINO_PADRAO = "wm_welton@hotmail.com";
const semCache = { "Cache-Control": "private, no-store" };

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface Alerta {
  id: number;
  tipo: string;
  gravidade: string;
  titulo: string;
  detalhe: string | null;
  email_envolvido: string | null;
  em: string;
}

export async function POST(request: Request) {
  let token = "";
  try {
    const corpo = (await request.json()) as { t?: unknown };
    if (typeof corpo.t === "string") token = corpo.t.slice(0, 200);
  } catch {
    /* sem corpo válido */
  }
  if (!token) return NextResponse.json({ ok: false }, { status: 401, headers: semCache });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chavePublica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chavePublica || !envioDeEmailAtivo()) {
    return NextResponse.json({ ok: false }, { status: 503, headers: semCache });
  }
  const db = createClient(url, chavePublica, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });

  const { data, error } = await db.rpc("reservar_alertas", { p_token: token });
  if (error) {
    console.error("[alertas] falha ao reservar alertas:", error.code, error.message);
    return NextResponse.json({ ok: false, etapa: "leitura" }, { status: 500, headers: semCache });
  }

  const alertas = (data ?? []) as Alerta[];
  const destino = process.env.ALERTAS_EMAIL_DESTINO || DESTINO_PADRAO;
  let enviados = 0;

  for (const a of alertas) {
    const quando = new Date(a.em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const linhas = [
      `O que aconteceu: ${a.titulo}`,
      a.email_envolvido ? `Conta: ${a.email_envolvido}` : null,
      a.detalhe ? `Detalhe: ${a.detalhe}` : null,
      `Quando: ${quando} (horário de Brasília)`,
    ].filter(Boolean) as string[];

    const html =
      `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:16px">` +
      `<h2 style="color:#b91c1c;margin:0 0 12px">⚠️ Alerta de segurança — Plano Docente</h2>` +
      linhas.map((l) => `<p style="margin:6px 0;font-size:15px">${esc(l)}</p>`).join("") +
      `<p style="margin:16px 0 0;font-size:13px;color:#555">Só 3 pessoas estão autorizadas a usar o aplicativo. ` +
      `Se não foi você ou alguém autorizado, troque as senhas e mantenha os cadastros fechados.</p></div>`;

    const r = await enviarEmail({
      para: destino,
      assunto: `[ALERTA] ${a.titulo}`.slice(0, 150),
      html,
      texto: `ALERTA DE SEGURANÇA — Plano Docente\n\n${linhas.join("\n")}`,
    });

    if (r.ok) enviados += 1;
    else console.error("[alertas] falha ao enviar e-mail:", r.motivo, r.detalhe);

    const { error: e2 } = await db.rpc("concluir_alerta", {
      p_token: token,
      p_id: a.id,
      p_ok: r.ok,
      p_erro: r.ok ? null : `${r.motivo}${r.detalhe ? `: ${r.detalhe}` : ""}`,
    });
    if (e2) console.error("[alertas] falha ao marcar alerta:", e2.code, e2.message);
  }

  return NextResponse.json({ ok: true, enviados }, { headers: semCache });
}
