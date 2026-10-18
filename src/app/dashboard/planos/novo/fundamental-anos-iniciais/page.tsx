import { carregarHabilidades } from "@/lib/habilidades";
import { createClient } from "@/lib/supabase/server";
import PlanoFormFundamentalAnosIniciais from "../../plano-form-fundamental-anos-iniciais";
import { criarPlano } from "../../actions";
import VoltarLink from "../../voltar-link";
import CabecalhoPagina from "@/components/cabecalho-pagina";

export default async function NovoPlanoFundamentalAnosIniciaisPage() {
  const supabase = await createClient();

  const [{ data: disciplinas }, { data: escolas }, { data: habilidades }] = await Promise.all([
    supabase
      .from("disciplinas")
      .select("*")
      .eq("etapa", "Ensino Fundamental - Anos Iniciais")
      .order("nome"),
    supabase.from("escolas").select("*").order("nome"),
    carregarHabilidades(supabase, "Ensino Fundamental - Anos Iniciais"),
  ]);

  const idsDisciplinas = (disciplinas ?? []).map((d) => d.id);
  const { data: competencias } =
    idsDisciplinas.length > 0
      ? await supabase.from("competencias_curriculares").select("*").in("disciplina_id", idsDisciplinas).order("numero")
      : { data: [] };

  return (
    <div>
      <VoltarLink href="/dashboard/planos/novo" rotulo="Voltar à escolha da etapa" />
      <div className="mt-2">
        <CabecalhoPagina tom="verde" icone="lapis" titulo="Novo plano — Ensino Fundamental, Anos Iniciais" subtitulo="1º ao 5º ano. Preencha por etapas; o plano pode ser salvo como rascunho." />
      </div>
      <div className="mt-6">
        <PlanoFormFundamentalAnosIniciais
          disciplinas={disciplinas ?? []}
          escolas={escolas ?? []}
          habilidades={habilidades ?? []}
          competencias={competencias ?? []}
          action={criarPlano}
          textoBotao="Salvar plano"
        />
      </div>
    </div>
  );
}
