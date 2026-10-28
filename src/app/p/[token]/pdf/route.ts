import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { criarClienteServico } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BUCKET = "compartilhados";
const VALIDADE_URL_SEGUNDOS = 60;

/**
 * Entrega o PDF de um plano compartilhado. A cada acesso confere o token e o prazo (via RPC) e só então
 * redireciona para uma URL assinada de curta duração. Assim o arquivo não depende de um endereço público fixo.
 * Se a chave de serviço não estiver disponível, usa o endereço público (enquanto o bucket ainda for público).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const naoEncontrado = () => new NextResponse("Link indisponível.", { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!/^[A-Za-z0-9_-]{24,64}$/.test(token)) return naoEncontrado();

  const supabase = await createClient();
  const { data } = await supabase.rpc("compartilhamento_publico", { p_token: token });
  const item = ((data as { arquivo_path: string; titulo: string }[] | null) ?? [])[0];
  if (!item) return naoEncontrado();

  const baixar = req.nextUrl.searchParams.get("baixar") === "1";
  const admin = criarClienteServico();
  if (admin) {
    const { data: assinada, error } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(item.arquivo_path, VALIDADE_URL_SEGUNDOS, baixar ? { download: true } : undefined);
    if (!error && assinada?.signedUrl) {
      return NextResponse.redirect(assinada.signedUrl, { status: 302, headers: { "Cache-Control": "no-store" } });
    }
    console.error("[compartilhados] não foi possível assinar a URL do PDF:", error?.message ?? "sem retorno");
  }
  const publica = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${item.arquivo_path}${baixar ? "?download=1" : ""}`;
  return NextResponse.redirect(publica, { status: 302, headers: { "Cache-Control": "no-store" } });
}
