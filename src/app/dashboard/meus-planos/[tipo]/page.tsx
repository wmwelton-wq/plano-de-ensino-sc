import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import { Icone } from "@/components/icones";
import NavegacaoTopo from "@/components/navegacao-topo";
import { CartaoPasta, SEM_ESCOLA, TIPOS, agruparPorEscola, carregarPlanos, tipoValido, type TipoPlano } from "../dados";

export default async function EscolasDoTipoPage({
  params,
  searchParams,
}: {
  params: Promise<{ tipo: string }>;
  searchParams: Promise<{ copias?: string; novos?: string }>;
}) {
  const { tipo: tipoBruto } = await params;
  const { copias, novos } = await searchParams;
  if (!tipoValido(tipoBruto)) notFound();
  const tipo = tipoBruto as TipoPlano;

  const supabase = await createClient();
  const planos = await carregarPlanos(supabase, tipo);
  const escolas = agruparPorEscola(planos);
  const info = TIPOS[tipo];

  return (
    <div>
      <NavegacaoTopo
        voltarHref="/dashboard/meus-planos"
        voltarRotulo="Voltar aos meus planos"
        migalhas={[
          { rotulo: "Início", href: "/dashboard" },
          { rotulo: "Meus planos", href: "/dashboard/meus-planos" },
          { rotulo: info.titulo },
        ]}
      />
      <CabecalhoPagina
        tom={tipo === "anuais" ? "azul" : "verde"}
        ilustracao={tipo === "anuais" ? "anual" : "mensal"}
        titulo={info.titulo}
        subtitulo="Escolha a escola para ver as turmas e os planos."
        acoes={
          <Link href={info.novo} className="btn-azul">
            <Icone nome="mais" className="h-4 w-4" /> Novo {info.singular}
          </Link>
        }
      />

      {(copias || novos) && (
        <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {copias
            ? `${copias} cópia(s) criada(s) como rascunho. Abra a escola e a turma para ajustar cada uma.`
            : `${novos} plano(s) mensal(is) criado(s) como rascunho. Abra a escola e a turma para completar cada um.`}
        </p>
      )}

      {escolas.length === 0 ? (
        <div className="card mt-8 border-dashed p-12 text-center">
          <p className="text-slate-600">Você ainda não criou nenhum {info.singular}.</p>
          <Link href={info.novo} className="btn-azul mt-4 inline-flex">
            Criar {info.singular}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {escolas.map((e) => (
            <li key={e.chave}>
              <CartaoPasta
                href={`/dashboard/meus-planos/${tipo}/${e.chave}`}
                icone={e.chave === SEM_ESCOLA ? "pasta" : "escola"}
                tom={e.chave === SEM_ESCOLA ? "ardosia" : "ambar"}
                titulo={e.nome}
                contagem={e.planos.length}
                logoUrl={e.logoUrl}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
