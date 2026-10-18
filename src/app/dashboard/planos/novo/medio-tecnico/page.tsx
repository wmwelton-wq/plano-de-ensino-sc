import { carregarHabilidades } from "@/lib/habilidades";
import { createClient } from "@/lib/supabase/server";
import PlanoForm from "../../plano-form";
import { criarPlano } from "../../actions";
import VoltarLink from "../../voltar-link";
import CabecalhoPagina from "@/components/cabecalho-pagina";

export default async function NovoPlanoMedioTecnicoPage() {
  const supabase = await createClient();

  const [
    { data: disciplinas },
    { data: cursos },
    { data: escolas },
    { data: habilidades },
    { data: competencias },
    { data: objetosMedio },
  ] = await Promise.all([
    supabase.from("disciplinas").select("*").eq("etapa", "Ensino Médio").order("nome"),
    supabase.from("cursos_tecnicos").select("*").order("nome"),
    supabase.from("escolas").select("*").order("nome"),
    carregarHabilidades(supabase),
    supabase.from("competencias_curriculares").select("*").order("numero"),
    supabase.from("objetos_conhecimento_medio").select("*").order("objeto"),
  ]);

  return (
    <div>
      <VoltarLink href="/dashboard/planos/novo" rotulo="Voltar à escolha da etapa" />
      <div className="mt-2">
        <CabecalhoPagina tom="violeta" icone="graduacao" titulo="Novo plano — Ensino Médio e Cursos Técnicos" subtitulo="Formação Geral Básica, itinerários e cursos técnicos. Preencha por etapas; o plano pode ser salvo como rascunho." />
      </div>
      <div className="mt-6">
        <PlanoForm
          etapa="ensino_medio"
          disciplinas={disciplinas ?? []}
          cursos={cursos ?? []}
          escolas={escolas ?? []}
          habilidades={habilidades ?? []}
          objetosMedio={objetosMedio ?? []}
          competencias={competencias ?? []}
          action={criarPlano}
          textoBotao="Salvar plano"
          rotuloGrupoDisciplinas="Formação Geral Básica"
        />
      </div>
    </div>
  );
}
