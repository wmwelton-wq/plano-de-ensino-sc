import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface Atalho {
  href: string;
  icone: string;
  titulo: string;
  texto: string;
  destaque?: boolean;
}

function Cartao({ href, icone, titulo, texto, destaque }: Atalho) {
  return (
    <Link
      href={href}
      className={`card card-interactive flex items-start gap-4 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        destaque ? "border-2 border-primary-400 bg-primary-50/50" : ""
      }`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-2xl" aria-hidden="true">
        {icone}
      </span>
      <span>
        <span className="block text-lg font-bold text-slate-900">{titulo}</span>
        <span className="mt-0.5 block text-sm text-slate-500">{texto}</span>
      </span>
    </Link>
  );
}

export default async function InicioPage() {
  const supabase = await createClient();

  const [{ data: planos }, { data: planosAnuais }, { data: escolas }] = await Promise.all([
    supabase.from("planos_de_ensino").select("id, status"),
    supabase.from("planos_anuais").select("id, status"),
    supabase.from("escolas").select("id"),
  ]);

  const todos = [...(planos ?? []), ...(planosAnuais ?? [])] as { status: string }[];
  const total = todos.length;
  const finalizados = todos.filter((p) => p.status === "finalizado").length;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Início</h1>
      <p className="mt-1 text-sm text-slate-500">
        Tudo o que você precisa está aqui. Você também pode usar o menu no topo da página.
      </p>

      {total > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="card p-5">
            <p className="text-sm text-slate-500">Total de planos</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{total}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-500">Finalizados</p>
            <p className="mt-1 text-2xl font-semibold text-green-700">{finalizados}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-500">Em rascunho</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">{total - finalizados}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-500">Escolas cadastradas</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{escolas?.length ?? 0}</p>
          </div>
        </div>
      )}

      <h2 className="mt-8 text-lg font-bold text-slate-900">Planos</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Cartao href="/dashboard/meus-planos" icone="📚" titulo="Meus planos" texto="Veja todos os planos, organizados por escola e turma." destaque />
        <Cartao href="/dashboard/meus-planos/anuais" icone="📅" titulo="Planos anuais" texto={`${planosAnuais?.length ?? 0} plano(s) — por escola e turma.`} />
        <Cartao href="/dashboard/meus-planos/mensais" icone="🗓️" titulo="Planos mensais" texto={`${planos?.length ?? 0} plano(s) — por escola e turma.`} />
        <Cartao href="/dashboard/anual/novo" icone="➕" titulo="Cadastrar plano anual" texto="Comece um plano anual novo." />
        <Cartao href="/dashboard/planos/novo" icone="➕" titulo="Cadastrar plano mensal" texto="Comece um plano mensal novo." />
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Escolas</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Cartao href="/dashboard/escolas" icone="🏫" titulo="Minhas escolas" texto="Veja e edite as escolas cadastradas." />
        <Cartao href="/dashboard/escolas/nova" icone="➕" titulo="Cadastrar escola" texto="Cadastre o nome, o município e a logo." />
      </div>
    </div>
  );
}
