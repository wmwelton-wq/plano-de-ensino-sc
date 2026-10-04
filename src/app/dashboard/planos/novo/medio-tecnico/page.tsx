import { createClient } from "@/lib/supabase/server";
import PlanoForm from "../../plano-form";
import { criarPlano } from "../../actions";

export default async function NovoPlanoMedioTecnicoPage() {
  const supabase = await createClient();

  const [
    { data: disciplinas },
    { data: cursos },
    { data: escolas },
    { data: habilidades },
    { data: competencias },
  ] = await Promise.all([
    supabase.from("disciplinas").select("*").eq("etapa", "Ensino Médio").order("nome"),
    supabase.from("cursos_tecnicos").select("*").order("nome"),
    supabase.from("escolas").select("*").order("nome"),
    supabase
      .from("habilidades_curriculares")
      .select("*")
      .eq("validado", true)
      .order("codigo"),
    supabase.from("competencias_curriculares").select("*").order("numero"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Novo plano — Ensino Médio e Cursos Técnicos
      </h1>
      <div className="mt-6 card p-6">
        <PlanoForm
          etapa="ensino_medio"
          disciplinas={disciplinas ?? []}
          cursos={cursos ?? []}
          escolas={escolas ?? []}
          habilidades={habilidades ?? []}
          competencias={competencias ?? []}
          action={criarPlano}
          textoBotao="Salvar plano"
          rotuloGrupoDisciplinas="Formação Geral Básica"
        />
      </div>
    </div>
  );
}
