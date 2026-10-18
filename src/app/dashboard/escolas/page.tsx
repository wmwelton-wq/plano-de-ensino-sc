import { Icone } from "@/components/icones";
import { Ilustracao } from "@/components/ilustracoes";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoTopo from "@/components/navegacao-topo";

export default async function EscolasPage() {
  const supabase = await createClient();

  const { data: escolas } = await supabase
    .from("escolas")
    .select("id, nome, municipio, logo_url")
    .order("nome");

  return (
    <div>
      <NavegacaoTopo
        voltarHref="/dashboard"
        voltarRotulo="Voltar ao início"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Escolas" }]}
      />
      <CabecalhoPagina
        tom="ambar"
        ilustracao="escola"
        titulo="Minhas escolas"
        subtitulo="Cadastre suas escolas uma vez e reaproveite o nome, o município e a logo na hora de criar novos planos de ensino."
        acoes={
          <Link href="/dashboard/escolas/nova" className="btn-primary">
            <Icone nome="mais" className="h-4 w-4" /> Nova escola
          </Link>
        }
      />

      {!escolas || escolas.length === 0 ? (
        <div data-tom="ambar" className="atalho-ilustrado mt-8 flex flex-col items-center px-6 pb-10 pt-6 text-center">
          <div className="h-40 w-64">
            <Ilustracao nome="escola" tom="ambar" mais />
          </div>
          <p className="mt-2 text-lg font-extrabold text-slate-900">Nenhuma escola cadastrada ainda</p>
          <p className="mt-1 max-w-md text-sm text-slate-600">Cadastre sua escola uma vez e ela aparece pronta em todos os seus planos.</p>
          <Link href="/dashboard/escolas/nova" className="btn-primary mt-5">
            <Icone nome="mais" className="h-4 w-4" /> Cadastrar a primeira escola
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {escolas.map((escola) => (
            <li key={escola.id}>
              <Link
                href={`/dashboard/escolas/${escola.id}`}
                data-tom="ambar"
                className="atalho-ilustrado group flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                <div className="atalho-arte flex h-[124px] items-center justify-center px-4 py-2.5">
                  {escola.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={escola.logo_url} alt={`Logo de ${escola.nome}`} className="max-h-full max-w-[70%] rounded-xl bg-white object-contain p-2 shadow-sm" />
                  ) : (
                    <Ilustracao nome="escola" tom="ambar" />
                  )}
                </div>
                <div className="flex flex-1 items-start justify-between gap-3 p-4 pt-3">
                  <div className="min-w-0">
                    <p className="break-words text-base font-bold leading-snug text-slate-900">{escola.nome}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{escola.municipio}</p>
                  </div>
                  <span className="atalho-seta flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500" aria-hidden="true">
                    <Icone nome="setaDireita" className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
