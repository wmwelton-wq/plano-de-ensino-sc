import { createClient } from "@/lib/supabase/server";
import VoltarLink from "../../planos/voltar-link";
import PlanoAnualForm from "../plano-anual-form";
import { criarPlanoAnual } from "../actions";

export default async function NovoPlanoAnualPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: disciplinas }, { data: escolas }, { data: professor }] = await Promise.all([
    supabase.from("disciplinas").select("id, nome, area, etapa").order("nome"),
    supabase.from("escolas").select("*").order("nome"),
    user
      ? supabase.from("professores").select("nome").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div>
      <VoltarLink href="/dashboard" rotulo="Voltar aos meus planos" />
      <h1 className="text-2xl font-semibold text-slate-900">Novo plano de ensino anual</h1>
      <p className="mt-2 text-sm text-slate-600">
        Feito uma vez por ano, o plano anual reúne ementa, competências e o conteúdo dos três trimestres. Marque as opções
        do currículo e acrescente o que quiser.
      </p>
      <div className="mt-6">
        <PlanoAnualForm
          escolas={escolas ?? []}
          disciplinas={disciplinas ?? []}
          nomeProfessor={(professor as { nome?: string } | null)?.nome ?? ""}
          action={criarPlanoAnual}
          textoBotao="Salvar plano anual"
        />
      </div>
    </div>
  );
}
