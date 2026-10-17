import { Icone } from "@/components/icones";
import Link from "next/link";
import { DATA_ATUALIZACAO, NOME_SERVICO, VERSAO_DOCUMENTOS_LEGAIS } from "@/lib/legal";

/** Estrutura comum das páginas de Termos de Uso e Aviso de Privacidade. */
export default function DocumentoLegal({
  titulo,
  resumo,
  outro,
  indice,
  children,
}: {
  titulo: string;
  resumo: string;
  outro: { href: string; texto: string };
  indice: { id: string; titulo: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-300 bg-white print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <Link
            href="/"
            className="flex items-center gap-2 rounded font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-800 text-white">
              <Icone nome="livro" className="h-5 w-5" />
            </span>
            {NOME_SERVICO}
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href={outro.href} className="link-primary">
              {outro.texto}
            </Link>
            <Link href="/login" className="link-primary">
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{titulo}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Última atualização: {DATA_ATUALIZACAO} · Versão {VERSAO_DOCUMENTOS_LEGAIS}
        </p>
        <p className="mt-5 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm leading-relaxed text-primary-900">
          {resumo}
        </p>

        <nav aria-label="Índice" className="card mt-8 p-5">
          <p className="text-sm font-bold text-slate-800">Neste documento</p>
          <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {indice.map((item, i) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="link-primary">
                  {i + 1}. {item.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="mt-8 space-y-8">{children}</article>

        <footer className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500 print:hidden">
          <Link href="/termos-de-uso" className="link-primary">
            Termos de Uso
          </Link>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <Link href="/privacidade" className="link-primary">
            Aviso de Privacidade
          </Link>
        </footer>
      </main>
    </div>
  );
}

export function Secao({
  id,
  numero,
  titulo,
  children,
}: {
  id: string;
  numero: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-xl font-semibold text-slate-900">
        {numero}. {titulo}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

export function Lista({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5 marker:text-slate-400">{children}</ul>;
}

/** Tabela simples e responsiva (rola na horizontal em telas estreitas). */
export function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-slate-800">
          <tr>
            {cabecalho.map((c) => (
              <th key={c} scope="col" className="border-b border-slate-200 px-3 py-2 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, i) => (
            <tr key={i} className="align-top odd:bg-white even:bg-slate-50/50">
              {linha.map((celula, j) => (
                <td key={j} className="border-b border-slate-100 px-3 py-2 text-slate-700">
                  {celula}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
