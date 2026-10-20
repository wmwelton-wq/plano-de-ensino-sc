import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import { Icone } from "@/components/icones";
import VoltarLink from "../../planos/voltar-link";
import { urlDaPasta } from "../../meus-planos/dados";
import ExcluirButton from "../../planos/[id]/excluir-button";
import PlanoAnualComRascunho from "../form-com-rascunho";
import EstrelaFavorito from "../../meus-planos/estrela-favorito";
import { atualizarPlanoAnual, excluirPlanoAnual } from "../actions";
import type { PlanoAnual } from "@/lib/plano-anual";

export default async function EditarPlanoAnualPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string; passo?: string }>;
}) {
  const { id } = await params;
  const { salvo, passo } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.from("planos_anuais").select("*").eq("id", id).single();
  if (!data) notFound();
  const plano = data as PlanoAnual;

  const [{ data: disciplinas }, { data: escolas }] = await Promise.all([
    supabase.from("disciplinas").select("id, nome, area, etapa").order("nome"),
    supabase.from("escolas").select("*").order("nome"),
  ]);

  const atualizarComId = atualizarPlanoAnual.bind(null, id);
  const excluirComId = excluirPlanoAnual.bind(null, id);
  const base = `/dashboard/anual/${id}/visualizar`;

  return (
    <div>
      <VoltarLink href={urlDaPasta("anuais", plano.escola_id, plano.turma)} rotulo="Voltar à lista de planos" />
      <div className="mt-2">
        <CabecalhoPagina
          tom="azul"
          ilustracao="anual" compacto
          titulo="Editar plano anual"
          subtitulo={plano.titulo}
          acoes={
            <>
              <Link href={base} className="btn-azul-suave">
                <Icone nome="olho" className="h-4 w-4" />
                Visualizar plano
              </Link>
              <Link href={`${base}?auto=salvar`} className="btn-azul">
                <Icone nome="baixar" className="h-4 w-4" />
                Baixar PDF
              </Link>
              <Link href={`${base}?auto=word`} className="btn-azul-suave">
                <Icone nome="documento" className="h-4 w-4" />
                Baixar Word
              </Link>
              <Link href={`${base}?auto=imprimir`} className="btn-azul-suave">
                <Icone nome="imprimir" className="h-4 w-4" />
                Imprimir
              </Link>
              <ExcluirButton excluirAction={excluirComId} />
            </>
          }
          rodape={
            <>
              <EstrelaFavorito tipo="anuais" planoId={id} favorito={!!plano.favorito} rotulo />
              <Link href={`/dashboard/anual/${id}/duplicar`} className="btn-secondary !py-2">
                <Icone nome="copiar" className="h-4 w-4" />
                Duplicar para outra turma
              </Link>
              <Link href={`/dashboard/anual/${id}/mensal`} className="btn-secondary !py-2">
                <Icone nome="calendario" className="h-4 w-4" />
                Gerar planos mensais deste plano
              </Link>
            </>
          }
        />
      </div>

      {salvo && (
        <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Plano anual salvo com sucesso.
        </p>
      )}

      <div className="mt-6">
        <PlanoAnualComRascunho
          chave={`anual:${id}`}
          limparAoSalvar={["anual:novo"]}
          salvo={!!salvo}
          escolas={escolas ?? []}
          disciplinas={disciplinas ?? []}
          nomeProfessor=""
          plano={plano}
          action={atualizarComId}
          textoBotao="Salvar alterações"
          passoInicial={typeof passo === "string" && passo.length <= 120 ? passo : undefined}
        />
      </div>
    </div>
  );
}
