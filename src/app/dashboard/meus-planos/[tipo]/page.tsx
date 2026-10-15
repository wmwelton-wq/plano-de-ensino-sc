import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CartaoPasta, Migalhas, SEM_ESCOLA, TIPOS, agruparPorEscola, carregarPlanos, tipoValido } from "../dados";

export default async function EscolasDoTipoPage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  if (!tipoValido(tipo)) notFound();

  const supabase = await createClient();
  const planos = await carregarPlanos(supabase, tipo);
  const escolas = agruparPorEscola(planos);
  const info = TIPOS[tipo];

  return (
    <div>
      <Migalhas
        itens={[
          { rotulo: "Início", href: "/dashboard" },
          { rotulo: "Meus planos", href: "/dashboard/meus-planos" },
          { rotulo: info.titulo },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{info.titulo}</h1>
          <p className="mt-1 text-sm text-slate-500">Escolha a escola para ver as turmas e os planos.</p>
        </div>
        <Link href={info.novo} className="btn-azul">
          <span aria-hidden="true">+</span> Novo {info.singular}
        </Link>
      </div>

      {escolas.length === 0 ? (
        <div className="card mt-8 border-dashed p-12 text-center">
          <p className="text-slate-600">Você ainda não criou nenhum {info.singular}.</p>
          <Link href={info.novo} className="btn-azul mt-4 inline-flex">
            Criar {info.singular}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {escolas.map((e) => (
            <li key={e.chave}>
              <CartaoPasta
                href={`/dashboard/meus-planos/${tipo}/${e.chave}`}
                icone={e.chave === SEM_ESCOLA ? "📂" : "🏫"}
                titulo={e.nome}
                contagem={e.planos.length}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
