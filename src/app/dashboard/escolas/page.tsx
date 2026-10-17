import { Icone } from "@/components/icones";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function EscolasPage() {
  const supabase = await createClient();

  const { data: escolas } = await supabase
    .from("escolas")
    .select("id, nome, municipio, logo_url")
    .order("nome");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Minhas escolas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre suas escolas uma vez e reaproveite o nome, o município e a logo na hora de
            criar novos planos de ensino.
          </p>
        </div>
        <Link href="/dashboard/escolas/nova" className="btn-primary">
          <Icone nome="mais" className="h-4 w-4" /> Nova escola
        </Link>
      </div>

      {!escolas || escolas.length === 0 ? (
        <div className="card mt-8 border-dashed p-12 text-center">
          <div data-tom="ambar" className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg [background:var(--tom-claro)] [color:var(--tom)]">
            <Icone nome="escola" className="h-6 w-6" />
          </div>
          <p className="mt-4 text-slate-600">Você ainda não cadastrou nenhuma escola.</p>
          <Link href="/dashboard/escolas/nova" className="link-primary mt-4 inline-block">
            Cadastrar a primeira escola
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {escolas.map((escola) => (
            <li key={escola.id}>
              <Link
                href={`/dashboard/escolas/${escola.id}`}
                className="card card-interactive flex items-center gap-4 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                {escola.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={escola.logo_url}
                    alt={`Logo de ${escola.nome}`}
                    className="h-11 w-11 rounded-lg border border-slate-200 bg-white object-contain p-1"
                  />
                ) : (
                  <div data-tom="ambar" className="flex h-11 w-11 items-center justify-center rounded-lg [background:var(--tom-claro)] [color:var(--tom)]">
                    <Icone nome="escola" className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-slate-900">{escola.nome}</p>
                  <p className="text-sm text-slate-500">{escola.municipio}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
