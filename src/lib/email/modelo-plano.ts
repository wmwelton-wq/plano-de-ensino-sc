/** Modelo do e-mail "um colega compartilhou um plano com você". Todo texto vindo do usuário é escapado. */

export function escaparHtml(t: string): string {
  return t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** Tira quebras de linha e caracteres de controle (o assunto do e-mail precisa ser uma linha só). */
function umaLinha(t: string, max: number): string {
  return t.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export interface DadosEmailPlano {
  nomeRemetente: string;
  nomeDestinatario: string;
  tituloPlano: string;
  link: string;
  validoAte: string; // dd/mm/aaaa
  mensagem: string;
}

export function montarEmailPlano(d: DadosEmailPlano): { assunto: string; html: string; texto: string } {
  const remetente = umaLinha(d.nomeRemetente, 80) || "Um professor";
  const destinatario = umaLinha(d.nomeDestinatario, 80);
  const titulo = umaLinha(d.tituloPlano, 140) || "Plano de ensino";
  const mensagem = d.mensagem.replace(/\r/g, "").trim().slice(0, 500);

  const assunto = umaLinha(`${remetente} compartilhou um plano com você: ${titulo}`, 200);

  const htmlMensagem = mensagem
    ? `<p style="margin:16px 0;padding:12px 14px;background:#f1f5f9;border-radius:10px;color:#334155;font-size:15px;line-height:1.5;white-space:pre-wrap">${escaparHtml(mensagem)}</p>`
    : "";

  const html = `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e2e8f0;border-top:5px solid #2563eb;border-radius:16px">
<tr><td style="padding:28px 28px 8px">
<p style="margin:0 0 4px;font-size:12px;font-weight:bold;letter-spacing:.06em;text-transform:uppercase;color:#1d4ed8">Plano Docente</p>
<h1 style="margin:0 0 12px;font-size:20px;line-height:1.3">${escaparHtml(remetente)} compartilhou um plano com você</h1>
<p style="margin:0 0 4px;font-size:15px;line-height:1.5">Olá${destinatario ? `, ${escaparHtml(destinatario)}` : ""}!</p>
<p style="margin:0;font-size:15px;line-height:1.5">Plano: <strong>${escaparHtml(titulo)}</strong></p>
${htmlMensagem}
<p style="margin:20px 0"><a href="${escaparHtml(d.link)}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 20px;border-radius:10px">Abrir o plano e baixar o PDF</a></p>
<p style="margin:0 0 6px;font-size:13px;color:#475569">O link é somente de leitura e vale até ${escaparHtml(d.validoAte)}.</p>
<p style="margin:0 0 20px;font-size:13px;color:#475569">Se o botão não abrir, copie este endereço no navegador:<br><span style="word-break:break-all;color:#1d4ed8">${escaparHtml(d.link)}</span></p>
</td></tr>
<tr><td style="padding:14px 28px 24px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.5;color:#64748b">
Você recebeu este e-mail porque ${escaparHtml(remetente)} escolheu enviar este plano para o seu endereço. Para responder a ele, basta responder este e-mail. Se você não esperava esta mensagem, pode ignorá-la: nada é criado em seu nome.
</td></tr>
</table></td></tr></table></body></html>`;

  const texto = [
    `${remetente} compartilhou um plano com você.`,
    "",
    destinatario ? `Olá, ${destinatario}!` : "Olá!",
    `Plano: ${titulo}`,
    mensagem ? `\n${mensagem}\n` : "",
    `Abrir o plano e baixar o PDF: ${d.link}`,
    `O link é somente de leitura e vale até ${d.validoAte}.`,
    "",
    `Você recebeu este e-mail porque ${remetente} escolheu enviar este plano para o seu endereço. Para responder a ele, basta responder este e-mail. Se você não esperava esta mensagem, pode ignorá-la.`,
  ].join("\n");

  return { assunto, html, texto };
}
