import { carregarHabilidades } from "@/lib/habilidades";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { EtapaPlano } from "@/lib/database.types";
import PlanoForm from "../plano-form";
import PlanoFormInfantil from "../plano-form-infantil";
import PlanoFormFundamentalAnosIniciais from "../plano-form-fundamental-anos-iniciais";
import { atualizarPlano, excluirPlano } from "../actions";
import ExcluirButton from "./excluir-button";
import AcoesRapidas from "./acoes-rapidas";
import VoltarLink from "../voltar-link";

const DISCIPLINA_ETAPA: Record<Exclude<EtapaPlano, "educacao_infantil">, string> = {
  ensino_medio: "Ensino Médio",
  fundamental_anos_iniciais: "Ensino Fundamental - Anos Iniciais",
  fundamental_anos_finais: "Ensino Fundamental - Anos Finais",
};

const ROTULOS_ETAPA: Record<EtapaPlano, string> = {
  educacao_infantil: "Educação Infantil",
  fundamental_anos_iniciais: "Ensino Fundamental — Anos Iniciais",
  fundamental_anos_finais: "Ensino Fundamental — Anos Finais",
  ensino_medio: "Ensino Médio / Curso Técnico",
};

export default async function EditarPlanoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plano } = await supabase.from("planos_de_ensino").select("*").eq("id", id).single();

  if (!plano) {
    notFound();
  }

  const etapa = (plano.etapa ?? "ensino_medio") as EtapaPlano;

  const [{ data: escolas }, { data: planoHabilidades }] = await Promise.all([
    supabase.from("escolas").select("*").order("nome"),
    supabase.from("planos_habilidades").select("habilidade_id").eq("plano_id", id),
  ]);
  const habilidadesSelecionadasIds = (planoHabilidades ?? []).map((p) => p.habilidade_id);

  const atualizarComId = atualizarPlano.bind(null, id);
  const excluirComId = excluirPlano.bind(null, id);

  const cabecalho = (
    <>
    <VoltarLink href="/dashboard" rotulo="Voltar aos meus planos" />
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Editar plano de ensino</h1>
        <p className="text-sm text-slate-500">{ROTULOS_ETAPA[etapa]}</p>
      </div>
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/planos/${id}/replicar`} className="btn-secondary">
          Replicar para outras turmas
        </Link>
        <Link
          href={`/dashboard/planos/${id}/visualizar`}
          className="btn-secondary"
        >
          Visualizar / Imprimir PDF
        </Link>
        <ExcluirButton excluirAction={excluirComId} />
      </div>
    </div>
    </>
  );

  if (etapa === "educacao_infantil") {
    const [{ data: camposExperiencia }, { data: objetivos }] = await Promise.all([
      supabase.from("disciplinas").select("*").eq("etapa", "Educação Infantil").order("nome"),
      carregarHabilidades(supabase, "Educação Infantil"),
    ]);

    return (
      <div>
        {cabecalho}
        <div className="mt-6 card p-6">
          <PlanoFormInfantil
            camposExperiencia={camposExperiencia ?? []}
            escolas={escolas ?? []}
            objetivosAprendizagem={objetivos ?? []}
            objetivosSelecionadosIds={habilidadesSelecionadasIds}
            plano={plano}
            action={atualizarComId}
            textoBotao="Salvar alterações"
          />
          <AcoesRapidas planoId={id} />
        </div>
      </div>
    );
  }

  if (etapa === "fundamental_anos_iniciais") {
    const [{ data: disciplinas }, { data: habilidades }, { data: planoDisciplinas }] = await Promise.all([
      supabase
        .from("disciplinas")
        .select("*")
        .eq("etapa", "Ensino Fundamental - Anos Iniciais")
        .order("nome"),
      carregarHabilidades(supabase, "Ensino Fundamental - Anos Iniciais"),
      supabase.from("planos_disciplinas").select("disciplina_id").eq("plano_id", id),
    ]);

    const disciplinasSelecionadasIds = (planoDisciplinas ?? []).map((p) => p.disciplina_id);

    return (
      <div>
        {cabecalho}
        <div className="mt-6 card p-6">
          <PlanoFormFundamentalAnosIniciais
            disciplinas={disciplinas ?? []}
            escolas={escolas ?? []}
            habilidades={habilidades ?? []}
            habilidadesSelecionadasIds={habilidadesSelecionadasIds}
            disciplinasSelecionadasIds={disciplinasSelecionadasIds}
            plano={plano}
            action={atualizarComId}
            textoBotao="Salvar alterações"
          />
          <AcoesRapidas planoId={id} />
        </div>
      </div>
    );
  }

  const etapaDisciplina = DISCIPLINA_ETAPA[etapa];
  const habilidadesQuery = carregarHabilidades(
    supabase,
    etapa === "ensino_medio" ? undefined : etapaDisciplina
  );

  const [{ data: disciplinas }, { data: cursos }, { data: habilidades }, { data: competencias }, { data: planoCompetencias }, { data: objetosMedio }] =
    await Promise.all([
      supabase.from("disciplinas").select("*").eq("etapa", etapaDisciplina).order("nome"),
      etapa === "ensino_medio"
        ? supabase.from("cursos_tecnicos").select("*").order("nome")
        : Promise.resolve({ data: [] }),
      habilidadesQuery,
      supabase.from("competencias_curriculares").select("*").order("numero"),
      supabase.from("planos_competencias").select("competencia_id").eq("plano_id", id),
      etapa === "ensino_medio"
        ? supabase.from("objetos_conhecimento_medio").select("*").order("objeto")
        : Promise.resolve({ data: [] }),
    ]);

  const competenciasSelecionadasIds = (planoCompetencias ?? []).map((c) => c.competencia_id);

  return (
    <div>
      {cabecalho}
      <div className="mt-6 card p-6">
        <PlanoForm
          etapa={etapa}
          disciplinas={disciplinas ?? []}
          cursos={cursos ?? []}
          escolas={escolas ?? []}
          habilidades={habilidades ?? []}
          objetosMedio={objetosMedio ?? []}
          habilidadesSelecionadasIds={habilidadesSelecionadasIds}
          competencias={competencias ?? []}
          competenciasSelecionadasIds={competenciasSelecionadasIds}
          plano={plano}
          action={atualizarComId}
          textoBotao="Salvar alterações"
          rotuloGrupoDisciplinas={etapa === "ensino_medio" ? "Formação Geral Básica" : "Componentes curriculares"}
          rotuloTurma={etapa === "ensino_medio" ? "Série/ano (turma)" : "Ano/turma"}
          placeholderTurma={etapa === "ensino_medio" ? "Ex.: 1ª série" : "Ex.: 3º ano A"}
        />
        <AcoesRapidas planoId={id} />
      </div>
    </div>
  );
}
