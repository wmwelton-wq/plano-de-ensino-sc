import { createClient } from "@/lib/supabase/server";
import PlanoFormInfantil from "../../plano-form-infantil";
import { criarPlano } from "../../actions";

export default async function NovoPlanoInfantilPage() {
  const supabase = await createClient();

  const [{ data: camposExperiencia }, { data: escolas }, { data: objetivos }] = await Promise.all([
    supabase.from("disciplinas").select("*").eq("etapa", "Educação Infantil").order("nome"),
    supabase.from("escolas").select("*").order("nome"),
    supabase
      .from("habilidades_curriculares")
      .select("*")
      .eq("validado", true)
      .eq("etapa", "Educação Infantil")
      .order("codigo"),
  ]);

  return (
    <div>
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
