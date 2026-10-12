import { carregarHabilidades } from "@/lib/habilidades";
import { createClient } from "@/lib/supabase/server";
import PlanoForm from "../../plano-form";
import { criarPlano } from "../../actions";
import VoltarLink from "../../voltar-link";

export default async function NovoPlanoFundamentalAnosFinaisPage() {
  const supabase = await createClient();

  const [
    { data: disciplinas },
    { data: escolas },
    { data: habilidades },
    { data: competencias },
  ] = await Promise.all([
    supabase
      .from("disciplinas")
      .select("*")
      .eq("etapa", "Ensino Fundamental - Anos Finais")
      .order("nome"),
    supabase.from("escolas").select("*").order("nome"),
    carregarHabilidades(supabase, "Ensino Fundamental - Anos Finais"),
    supabase
      .from("competencias_curriculares")
      .select("*")
      .eq("etapa", "Ensino Fundamental - Anos Finais")
      .order("numero"),
  ]);

  return (
    <div>
      <VoltarLink />
      <h1 className="text-2xl font-semibold text-slate-900">
        Novo plano — Ensino Fundamental, Anos Finais (6º ao 9º ano)
      </h1>
      <div className="mt-6">
        <PlanoForm
          etapa="fundamental_anos_finais"
          disciplinas={disciplinas ?? []}
          cursos={[]}
          escolas={escolas ?? []}
          habilidades={habilidades ?? []}
          competencias={competencias ?? []}
          action={criarPlano}
          textoBotao="Salvar plano"
          rotuloGrupoDisciplinas="Componentes curriculares"
          rotuloTurma="Ano/turma"
          placeholderTurma="Ex.: 7º ano A"
        />
      </div>
    </div>
  );
}
