/**
 * Envio de e-mail pelo Resend (https://resend.com), usando só `fetch` (sem biblioteca).
 *
 * Variáveis de ambiente (somente no servidor, na Vercel):
 *   RESEND_API_KEY   → chave do Resend (começa com "re_"). Sem ela, o envio fica desativado e o app avisa com clareza.
 *   EMAIL_REMETENTE  → ex.: "Plano Docente <nao-responda@planodocente.com.br>" (o domínio precisa estar verificado no Resend).
 *                      Se faltar, usa o padrão acima.
 */

export interface EmailParaEnviar {
  para: string;
  assunto: string;
  html: string;
  texto: string;
  /** Respostas vão para este endereço (o e-mail do professor que compartilhou). */
  responderPara?: string;
}

export type ResultadoEmail = { ok: true; id?: string } | { ok: false; motivo: "desativado" | "recusado" | "rede"; detalhe?: string };

const REMETENTE_PADRAO = "Plano Docente <nao-responda@planodocente.com.br>";

export function envioDeEmailAtivo(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function enviarEmail(e: EmailParaEnviar): Promise<ResultadoEmail> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return { ok: false, motivo: "desativado" };

  const corpo: Record<string, unknown> = {
    from: process.env.EMAIL_REMETENTE || REMETENTE_PADRAO,
    to: [e.para],
    subject: e.assunto,
    html: e.html,
    text: e.texto,
  };
  if (e.responderPara) corpo.reply_to = e.responderPara;

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(15000),
    });
    if (!resposta.ok) {
      let detalhe = `HTTP ${resposta.status}`;
      try {
        const j = (await resposta.json()) as { message?: string };
        if (j?.message) detalhe = `${detalhe}: ${j.message}`.slice(0, 300);
      } catch {
        /* sem corpo legível */
      }
      return { ok: false, motivo: "recusado", detalhe };
    }
    const j = (await resposta.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: j.id };
  } catch (erro) {
    return { ok: false, motivo: "rede", detalhe: erro instanceof Error ? erro.message : undefined };
  }
}
