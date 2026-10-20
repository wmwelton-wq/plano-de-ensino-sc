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
import CabecalhoPagina from "@/components/cabecalho-pagina";
import { Icone } from "@/components/icones";
import VoltarLink from "../voltar-link";
import { urlDaPasta } from "../../meus-planos/dados";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ passo?: string }>;
}) {
  const { id } = await params;
  const { passo } = await searchParams;
  const passoInicial = typeof passo === "string" && passo.length <= 80 ? passo : undefined;
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
      <VoltarLink href={urlDaPasta("mensais", plano.escola_id, plano.turma)} rotulo="Voltar à lista de planos" />
      <div className="mt-2">
        <CabecalhoPagina
          tom="verde"
          ilustracao="mensal" compacto
          titulo="Editar plano de ensino"
          subtitulo={ROTULOS_ETAPA[etapa]}
          acoes={
            <>
              <Link href={`/dashboard/planos/${id}/visualizar`} className="btn-azul-suave">
                <Icone nome="olho" className="h-4 w-4" />
                Visualizar plano
              </Link>
              <Link href={`/dashboard/planos/${id}/visualizar?auto=salvar`} className="btn-azul">
                <Icone nome="baixar" className="h-4 w-4" />
                Baixar PDF
              </Link>
              <Link href={`/dashboard/planos/${id}/visualizar?auto=word`} className="btn-azul-suave">
                <Icone nome="documento" className="h-4 w-4" />
                Baixar Word
              </Link>
              <Link href={`/dashboard/planos/${id}/visualizar?auto=imprimir`} className="btn-azul-suave">
                <Icone nome="imprimir" className="h-4 w-4" />
                Imprimir
              </Link>
              <Link href={`/dashboard/planos/${id}/replicar`} className="btn-secondary !py-2">
                <Icone nome="copiar" className="h-4 w-4" />
                Copiar para outras turmas
              </Link>
              <ExcluirButton excluirAction={excluirComId} />
            </>
          }
        />
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
        <div className="mt-6">
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
    const [{ data: disciplinas }, { data: habilidades }, { data: planoDisciplinas }, { data: planoCompetenciasAI }] = await Promise.all([
      supabase
        .from("disciplinas")
        .select("*")
        .eq("etapa", "Ensino Fundamental - Anos Iniciais")
        .order("nome"),
      carregarHabilidades(supabase, "Ensino Fundamental - Anos Iniciais"),
      supabase.from("planos_disciplinas").select("disciplina_id").eq("plano_id", id),
      supabase.from("planos_competencias").select("competencia_id").eq("plano_id", id),
    ]);

    const idsDisciplinas = (disciplinas ?? []).map((d) => d.id);
    const { data: competenciasAI } =
      idsDisciplinas.length > 0
        ? await supabase.from("competencias_curriculares").select("*").in("disciplina_id", idsDisciplinas).order("numero")
        : { data: [] };
    const disciplinasSelecionadasIds = (planoDisciplinas ?? []).map((p) => p.disciplina_id);

    return (
      <div>
        {cabecalho}
        <div className="mt-6">
          <PlanoFormFundamentalAnosIniciais
            disciplinas={disciplinas ?? []}
            escolas={escolas ?? []}
            habilidades={habilidades ?? []}
            habilidadesSelecionadasIds={habilidadesSelecionadasIds}
            disciplinasSelecionadasIds={disciplinasSelecionadasIds}
            competencias={competenciasAI ?? []}
            competenciasSelecionadasIds={(planoCompetenciasAI ?? []).map((c) => c.competencia_id)}
            plano={plano}
            action={atualizarComId}
            textoBotao="Salvar alterações"
            passoInicial={passoInicial}
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
      <div className="mt-6">
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
          passoInicial={passoInicial}
          rotuloGrupoDisciplinas={etapa === "ensino_medio" ? "Formação Geral Básica" : "Componentes curriculares"}
          rotuloTurma={etapa === "ensino_medio" ? "Série/ano (turma)" : "Ano/turma"}
          placeholderTurma={etapa === "ensino_medio" ? "Ex.: 1ª série" : "Ex.: 3º ano A"}
        />
        <AcoesRapidas planoId={id} />
      </div>
    </div>
  );
}
