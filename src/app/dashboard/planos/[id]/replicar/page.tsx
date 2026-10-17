import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import VoltarLink from "../../voltar-link";
import { replicarPlano } from "../../actions";
import ReplicarForm from "./replicar-form";

export default async function ReplicarPlanoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: plano }, { data: escolas }] = await Promise.all([
    supabase
      .from("planos_de_ensino")
      .select("id, titulo, etapa, turma, escola_id, data_inicio, data_fim, quantidade_aulas")
      .eq("id", id)
      .single(),
    supabase.from("escolas").select("id, nome, municipio").order("nome"),
  ]);

  if (!plano) {
    notFound();
  }

  const escolaOrigem = (escolas ?? []).find((e) => e.id === plano.escola_id);
  const replicarComId = replicarPlano.bind(null, id);

  return (
    <div>
      <VoltarLink href={`/dashboard/planos/${id}`} rotulo="Voltar ao plano" />
      <div className="mt-2">
        <CabecalhoPagina
          tom="violeta"
          icone="copiar"
          titulo="Replicar plano para outras escolas"
          subtitulo={
            <>
              Plano de origem: <strong>{plano.titulo}</strong>
              {plano.turma ? ` · ${plano.turma}` : ""}
              {escolaOrigem ? ` · ${escolaOrigem.nome}` : ""}
            </>
          }
        />
      </div>
      <div className="mt-6">
        <ReplicarForm
          planoId={id}
          tituloOrigem={plano.titulo}
          turmaOrigem={plano.turma}
          dataInicioOrigem={plano.data_inicio}
          dataFimOrigem={plano.data_fim}
          quantidadeAulasOrigem={plano.quantidade_aulas}
          escolaOrigemId={plano.escola_id}
          escolas={(escolas ?? []).map((e) => ({ id: e.id, nome: e.nome, municipio: e.municipio }))}
          action={replicarComId}
        />
      </div>
    </div>
  );
}
