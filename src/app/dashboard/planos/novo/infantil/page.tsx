import { carregarHabilidades } from "@/lib/habilidades";
import { createClient } from "@/lib/supabase/server";
import PlanoFormInfantil from "../../plano-form-infantil";
import { criarPlano } from "../../actions";
import VoltarLink from "../../voltar-link";

export default async function NovoPlanoInfantilPage() {
  const supabase = await createClient();

  const [{ data: camposExperiencia }, { data: escolas }, { data: objetivos }] = await Promise.all([
    supabase.from("disciplinas").select("*").eq("etapa", "Educação Infantil").order("nome"),
    supabase.from("escolas").select("*").order("nome"),
    carregarHabilidades(supabase, "Educação Infantil"),
  ]);

  return (
    <div>
      <VoltarLink />
      <h1 className="text-2xl font-semibold text-slate-900">Novo plano — Educação Infantil</h1>
      <div className="mt-6 card p-6">
        <PlanoFormInfantil
          camposExperiencia={camposExperiencia ?? []}
          escolas={escolas ?? []}
          objetivosAprendizagem={objetivos ?? []}
          action={criarPlano}
          textoBotao="Salvar plano"
        />
      </div>
    </div>
  );
}
