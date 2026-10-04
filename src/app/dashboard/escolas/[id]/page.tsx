import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EscolaForm from "../escola-form";
import { atualizarEscola, excluirEscola } from "../actions";
import ExcluirButton from "./excluir-button";

export default async function EditarEscolaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: escola } = await supabase.from("escolas").select("*").eq("id", id).single();

  if (!escola) {
    notFound();
  }

  const atualizarComId = atualizarEscola.bind(null, id);
  const excluirComId = excluirEscola.bind(null, id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Editar escola</h1>
        <ExcluirButton excluirAction={excluirComId} />
      </div>
      <div className="mt-6 max-w-lg card p-6">
        <EscolaForm escola={escola} action={atualizarComId} textoBotao="Salvar alterações" />
      </div>
    </div>
  );
}
