import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chamarIA, resumoDoErro, ErroIA } from "@/lib/ia/provedores";
import { registrarDetalheIA } from "@/lib/ia/registro";
import { LIMITE_BYTES_PDF, LIMITE_PAGINAS_PDF, SISTEMA_CALENDARIO, contarPaginasPdf, eventosDaResposta, promptCalendario } from "@/lib/ia/calendario-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

function erro(mensagem: string, status = 400) {
  return NextResponse.json({ ok: false, erro: mensagem }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Lê um calendário escolar em PDF e devolve as datas encontradas (nada é salvo aqui: o professor confere antes).
 * Regras: no máximo 4 páginas; até 6 envios no primeiro mês de uso e depois 1 por mês, por professor (conferido no banco, em ia_reservar).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return erro("Sessão expirada. Entre novamente.", 401);

  let arquivo: File | null = null;
  try {
    const dados = await request.formData();
    const f = dados.get("arquivo");
    arquivo = f instanceof File ? f : null;
  } catch {
    return erro("Não foi possível receber o arquivo.");
  }
  if (!arquivo) return erro("Escolha um arquivo PDF.");
  if (arquivo.size > LIMITE_BYTES_PDF) return erro("O PDF é grande demais (máximo de 4 MB).");

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  if (String.fromCharCode(...bytes.slice(0, 4)) !== "%PDF") return erro("O arquivo não parece ser um PDF.");

  const paginas = contarPaginasPdf(bytes);
  if (paginas !== null && paginas > LIMITE_PAGINAS_PDF) {
    return erro(`O PDF tem ${paginas} páginas. O limite é de ${LIMITE_PAGINAS_PDF}. Envie só as páginas do calendário.`);
  }
  // Não deu para contar as páginas: só aceitamos arquivos pequenos, para não gastar à toa.
  if (paginas === null && arquivo.size > 1_500_000) {
    return erro(`Não consegui conferir o número de páginas. Envie um PDF menor (até ${LIMITE_PAGINAS_PDF} páginas e 1,5 MB).`);
  }

  const reserva = await supabase.rpc("ia_reservar", { p_operacao: "calendario_pdf" });
  const r = reserva.data as { ok?: boolean; id?: string; motivo?: string } | null;
  if (reserva.error || !r?.ok || !r.id) return erro(r?.motivo ?? "Não foi possível usar a IA agora.", 429);

  try {
    const ano = new Date().getFullYear();
    const resposta = await chamarIA({
      sistema: SISTEMA_CALENDARIO,
      usuario: promptCalendario(ano),
      pdfBase64: Buffer.from(bytes).toString("base64"),
      maxTokens: 6000,
      json: true,
      temperatura: 0.1,
    });
    const eventos = eventosDaResposta(resposta.texto);
    await supabase.rpc("ia_finalizar", {
      p_id: r.id,
      p_modelo: `${resposta.provedor}:${resposta.modelo}`,
      p_tokens_entrada: resposta.tokensEntrada,
      p_tokens_saida: resposta.tokensSaida,
      p_custo: resposta.custo,
      p_status: "ok",
    });
    await registrarDetalheIA(supabase, r.id, resposta.falhas.length ? `recuperado: ${resposta.falhas.join(" | ")}` : null, resposta.duracaoMs);
    return NextResponse.json({ ok: true, eventos }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    // Falha dos provedores: o envio fica marcado como falha e não conta na cota de calendários.
    await supabase.rpc("ia_finalizar", { p_id: r.id, p_modelo: "-", p_tokens_entrada: 0, p_tokens_saida: 0, p_custo: 0, p_status: "erro" });
    await registrarDetalheIA(supabase, r.id, resumoDoErro(e), e instanceof ErroIA ? e.duracaoMs : null);
    return erro("A IA está indisponível agora. Seu direito de envio foi mantido; tente novamente mais tarde.", 503);
  }
}
