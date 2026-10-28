import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/logo";
import { Icone } from "@/components/icones";

export const metadata: Metadata = {
  title: "Plano compartilhado | Plano Docente",
  robots: { index: false, follow: false },
};

interface Compartilhamento {
  titulo: string;
  arquivo_path: string;
  criado_em: string;
  expira_em: string;
}

/** Página pública de leitura: quem recebe o link vê o título e abre/baixa o PDF. Não permite editar nada. */
export default async function PlanoCompartilhadoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let item: Compartilhamento | null = null;
  if (/^[A-Za-z0-9_-]{24,64}$/.test(token)) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("compartilhamento_publico", { p_token: token });
    item = ((data as Compartilhamento[] | null) ?? [])[0] ?? null;
  }
  // Link inexistente, vencido ou encerrado: responde 404 de verdade (a mensagem amigável fica em not-found.tsx).
  if (!item) notFound();
  // O PDF não é mais aberto por URL público direto: passa por /p/[token]/pdf, que confere token e prazo a cada acesso.
  const urlPdf = `/p/${token}/pdf`;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 bg-gradient-to-b from-primary-50/60 via-transparent to-transparent px-5 py-10 text-center">
      <Logo />
      {item && urlPdf ? (
        <section className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white text-center shadow-xl shadow-slate-900/5">
          <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 px-6 py-7 text-white">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/40 backdrop-blur">
              <Icone nome="documento" className="h-7 w-7" />
            </span>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-white/85">Plano compartilhado · somente leitura</p>
          </div>
          <div className="space-y-5 p-6">
            <h1 className="text-xl font-extrabold text-slate-900">{item.titulo}</h1>
            <p className="text-sm text-slate-600">
              Compartilhado em {new Date(item.criado_em).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}. O link vale até{" "}
              {new Date(item.expira_em).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <a href={urlPdf} target="_blank" rel="noopener noreferrer" className="btn-azul justify-center">
                <Icone nome="olho" className="h-4 w-4" />
                Abrir o plano (PDF)
              </a>
              <a href={`${urlPdf}?baixar=1`} className="btn-azul-suave justify-center">
                <Icone nome="baixar" className="h-4 w-4" />
                Baixar
              </a>
            </div>
          </div>
        </section>
      ) : (
        <section className="w-full space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Icone nome="alerta" className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-extrabold text-slate-900">Este link não está mais disponível</h1>
          <p className="text-sm text-slate-600">O link pode ter vencido ou o professor encerrou o compartilhamento. Peça um novo link a quem enviou.</p>
        </section>
      )}
      <Link href="/" className="text-sm font-semibold text-primary-700 hover:underline">
        Conhecer o Plano Docente
      </Link>
    </main>
  );
}
