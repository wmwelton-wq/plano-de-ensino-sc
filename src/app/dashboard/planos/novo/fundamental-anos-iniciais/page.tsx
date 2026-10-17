import { carregarHabilidades } from "@/lib/habilidades";
import { createClient } from "@/lib/supabase/server";
import PlanoFormFundamentalAnosIniciais from "../../plano-form-fundamental-anos-iniciais";
import { criarPlano } from "../../actions";
import VoltarLink from "../../voltar-link";

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
      <VoltarLink />
      <h1 className="text-2xl font-semibold text-slate-900">
        Novo plano — Ensino Fundamental, Anos Iniciais (1º ao 5º ano)
      </h1>
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
