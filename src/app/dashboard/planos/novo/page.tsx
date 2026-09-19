import { createClient } from "@/lib/supabase/server";
import PlanoForm from "../plano-form";
import { criarPlano } from "../actions";

export default async function NovoPlanoPage() {
  const supabase = await createClient();

  const [{ data: disciplinas }, { data: cursos }] = await Promise.all([
    supabase.from("disciplinas").select("*").order("nome"),
    supabase.from("cursos_tecnicos").select("*").order("nome"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Novo plano de ensino</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <PlanoForm
          disciplinas={disciplinas ?? []}
          cursos={cursos ?? []}
          action={criarPlano}
          textoBotao="Salvar plano"
        />
      </div>
    </div>
  );
}
