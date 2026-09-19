import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlanoForm from "../plano-form";
import { atualizarPlano, excluirPlano } from "../actions";
import ExcluirButton from "./excluir-button";

export default async function EditarPlanoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: plano }, { data: disciplinas }, { data: cursos }] = await Promise.all([
    supabase.from("planos_de_ensino").select("*").eq("id", id).single(),
    supabase.from("disciplinas").select("*").order("nome"),
    supabase.from("cursos_tecnicos").select("*").order("nome"),
  ]);

  if (!plano) {
    notFound();
  }

  const atualizarComId = atualizarPlano.bind(null, id);
  const excluirComId = excluirPlano.bind(null, id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Editar plano de ensino</h1>
        <ExcluirButton excluirAction={excluirComId} />
      </div>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <PlanoForm
          disciplinas={disciplinas ?? []}
          cursos={cursos ?? []}
          plano={plano}
          action={atualizarComId}
          textoBotao="Salvar alterações"
        />
      </div>
    </div>
  );
}
