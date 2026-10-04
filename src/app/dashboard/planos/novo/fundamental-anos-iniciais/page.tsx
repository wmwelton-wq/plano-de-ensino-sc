import { createClient } from "@/lib/supabase/server";
import PlanoFormFundamentalAnosIniciais from "../../plano-form-fundamental-anos-iniciais";
import { criarPlano } from "../../actions";

export default async function NovoPlanoFundamentalAnosIniciaisPage() {
  const supabase = await createClient();

  const [{ data: disciplinas }, { data: escolas }, { data: habilidades }] = await Promise.all([
    supabase
      .from("disciplinas")
      .select("*")
      .eq("etapa", "Ensino Fundamental - Anos Iniciais")
      .order("nome"),
    supabase.from("escolas").select("*").order("nome"),
    supabase
      .from("habilidades_curriculares")
      .select("*")
      .eq("validado", true)
      .eq("etapa", "Ensino Fundamental - Anos Iniciais")
      .order("codigo"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Novo plano — Ensino Fundamental, Anos Iniciais (1º ao 5º ano)
      </h1>
      <div className="mt-6 card p-6">
        <PlanoFormFundamentalAnosIniciais
          disciplinas={disciplinas ?? []}
          escolas={escolas ?? []}
          habilidades={habilidades ?? []}
          action={criarPlano}
          textoBotao="Salvar plano"
        />
      </div>
    </div>
  );
}
