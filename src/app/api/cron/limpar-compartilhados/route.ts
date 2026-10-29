import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServico } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BUCKET = "compartilhados";
const LOTE = 200;

/** A Vercel envia "Authorization: Bearer <CRON_SECRET>" nas tarefas agendadas. Sem o segredo configurado, nega tudo. */
function autorizado(req: NextRequest): boolean {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return false;
  const recebido = Buffer.from(req.headers.get("authorization") ?? "");
  const esperado = Buffer.from(`Bearer ${segredo}`);
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}

/**
 * Tarefa diária: apaga os PDFs compartilhados cujo link já venceu e os registros correspondentes.
 * Primeiro o arquivo, depois o registro: se o Storage falhar, o registro fica para a próxima rodada.
 */
export async function GET(req: NextRequest) {
  const semCache = { "Cache-Control": "no-store" };
  if (!autorizado(req)) return NextResponse.json({ ok: false }, { status: 401, headers: semCache });

  const admin = criarClienteServico();
  if (!admin) return NextResponse.json({ ok: false, erro: "cliente de serviço indisponível" }, { status: 503, headers: semCache });

  const { data, error } = await admin
    .from("plano_compartilhamentos")
    .select("id, arquivo_path")
    .lte("expira_em", new Date().toISOString())
    .limit(LOTE);
  if (error) {
    console.error("[cron-compartilhados] falha ao listar vencidos:", error.message);
    return NextResponse.json({ ok: false }, { status: 500, headers: semCache });
  }
  const linhas = (data ?? []) as { id: string; arquivo_path: string }[];
  if (linhas.length === 0) return NextResponse.json({ ok: true, removidos: 0 }, { headers: semCache });

  const { error: erroArquivos } = await admin.storage.from(BUCKET).remove(linhas.map((l) => l.arquivo_path));
  if (erroArquivos) {
    console.error("[cron-compartilhados] falha ao remover arquivos:", erroArquivos.message);
    return NextResponse.json({ ok: false }, { status: 500, headers: semCache });
  }
  const { error: erroRegistros } = await admin.from("plano_compartilhamentos").delete().in("id", linhas.map((l) => l.id));
  if (erroRegistros) {
    console.error("[cron-compartilhados] falha ao apagar registros:", erroRegistros.message);
    return NextResponse.json({ ok: false }, { status: 500, headers: semCache });
  }
  return NextResponse.json({ ok: true, removidos: linhas.length }, { headers: semCache });
}
