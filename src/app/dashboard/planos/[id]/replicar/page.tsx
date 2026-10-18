import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import VoltarLink from "../../voltar-link";
import Link from "next/link";
import { replicarPlano, replicarParaTurmas } from "../../actions";
import ReplicarForm from "./replicar-form";
import ReplicarTurmasForm from "./replicar-turmas-form";
import type { EtapaPlano } from "@/lib/database.types";

export default async function ReplicarPlanoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modo?: string }>;
}) {
  const { id } = await params;
  const { modo } = await searchParams;
  const paraEscolas = modo === "escolas";
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
          ilustracao="turma" compacto
          titulo={paraEscolas ? "Copiar plano para outras escolas" : "Copiar plano para outras turmas"}
          subtitulo={
            <>
              Plano de origem: <strong>{plano.titulo}</strong>
              {plano.turma ? ` · ${plano.turma}` : ""}
              {escolaOrigem ? ` · ${escolaOrigem.nome}` : ""}
            </>
          }
        />
      </div>
      <div className="mt-6 space-y-6">
        <nav aria-label="Para onde copiar" className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/planos/${id}/replicar`}
            aria-current={paraEscolas ? undefined : "page"}
            className={paraEscolas ? "btn-azul-suave" : "btn-azul"}
          >
            Para outras turmas
          </Link>
          <Link
            href={`/dashboard/planos/${id}/replicar?modo=escolas`}
            aria-current={paraEscolas ? "page" : undefined}
            className={paraEscolas ? "btn-azul" : "btn-azul-suave"}
          >
            Para outras escolas
          </Link>
        </nav>
        {paraEscolas ? (
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
        ) : (
          <ReplicarTurmasForm
            planoId={id}
            etapa={plano.etapa as EtapaPlano}
            tituloOrigem={plano.titulo}
            turmaOrigem={plano.turma}
            dataInicioOrigem={plano.data_inicio}
            dataFimOrigem={plano.data_fim}
            quantidadeAulasOrigem={plano.quantidade_aulas}
            escolaOrigemId={plano.escola_id}
            escolas={(escolas ?? []).map((e) => ({ id: e.id, nome: e.nome, municipio: e.municipio }))}
            action={replicarParaTurmas.bind(null, id)}
          />
        )}
      </div>
    </div>
  );
}
