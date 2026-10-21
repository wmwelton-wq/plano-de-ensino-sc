import { NextResponse } from "next/server";
import { criarClienteServico } from "@/lib/supabase/admin";
import { enviarEmail, envioDeEmailAtivo } from "@/lib/email/resend";

/**
 * Envia por e-mail os alertas de segurança pendentes (tabela `alertas_seguranca`).
 *
 * Quem chama: o banco (pg_net, na hora em que um alerta nasce) e a verificação periódica (pg_cron, a cada 5 min).
 * Esta rota é idempotente e não recebe dados: ela só lê o que o próprio banco registrou e envia UMA vez cada alerta
 * (a "reserva" de cada alerta é atômica). Quem chamar à toa não consegue forçar envio de nada que não exista.
 *
 * Variáveis (somente servidor, Vercel): RESEND_API_KEY, SUPABASE_SECRET_KEY (já existem);
 * ALERTAS_EMAIL_DESTINO (opcional; padrão = e-mail do administrador).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DESTINO_PADRAO = "wm_welton@hotmail.com";
const MAX_POR_CHAMADA = 10;
const MAX_TENTATIVAS = 10;

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
  tentativas: number;
}

async function processar() {
  const db = criarClienteServico();
  if (!db) return NextResponse.json({ ok: false }, { status: 503, headers: semCache });
  if (!envioDeEmailAtivo()) return NextResponse.json({ ok: false }, { status: 503, headers: semCache });

  const destino = process.env.ALERTAS_EMAIL_DESTINO || DESTINO_PADRAO;

  const { data, error } = await db
    .from("alertas_seguranca")
    .select("id,tipo,gravidade,titulo,detalhe,email_envolvido,em,tentativas")
    .is("enviado_em", null)
    .lt("tentativas", MAX_TENTATIVAS)
    .order("em", { ascending: true })
    .limit(MAX_POR_CHAMADA);
  if (error) {
    console.error("[alertas] falha ao ler alertas pendentes:", error.code, error.message);
    return NextResponse.json({ ok: false, etapa: "leitura", codigo: error.code ?? null }, { status: 500, headers: semCache });
  }

  let enviados = 0;
  for (const a of (data ?? []) as Alerta[]) {
    // Reserva atômica: só continua quem conseguir incrementar a tentativa a partir do valor lido.
    const { data: reservado } = await db
      .from("alertas_seguranca")
      .update({ tentativas: a.tentativas + 1 })
      .eq("id", a.id)
      .eq("tentativas", a.tentativas)
      .is("enviado_em", null)
      .select("id");
    if (!reservado || reservado.length === 0) continue;

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
      `Se não foi você ou alguém autorizado, troque as senhas e, se preciso, mantenha os cadastros fechados.</p></div>`;

    const r = await enviarEmail({
      para: destino,
      assunto: `[ALERTA] ${a.titulo}`.slice(0, 150),
      html,
      texto: `ALERTA DE SEGURANÇA — Plano Docente\n\n${linhas.join("\n")}`,
    });

    if (r.ok) {
      await db.from("alertas_seguranca").update({ enviado_em: new Date().toISOString(), ultimo_erro: null }).eq("id", a.id);
      enviados += 1;
    } else {
      console.error("[alertas] falha ao enviar e-mail:", r.motivo, r.detalhe);
      await db
        .from("alertas_seguranca")
        .update({ ultimo_erro: `${r.motivo}${r.detalhe ? `: ${r.detalhe}` : ""}`.slice(0, 300) })
        .eq("id", a.id);
    }
  }

  return NextResponse.json({ ok: true, enviados }, { headers: semCache });
}

export async function POST() {
  return processar();
}

export async function GET() {
  return processar();
}
