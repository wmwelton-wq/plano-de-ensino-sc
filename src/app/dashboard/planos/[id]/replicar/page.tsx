import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EtapaPlano } from "@/lib/database.types";
import VoltarLink from "../../voltar-link";
import { replicarPlano } from "../../actions";
import ReplicarForm from "./replicar-form";

export default async function ReplicarPlanoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plano } = await supabase
    .from("planos_de_ensino")
    .select("id, titulo, etapa, turma")
    .eq("id", id)
    .single();

  if (!plano) {
    notFound();
  }

  const replicarComId = replicarPlano.bind(null, id);

  return (
    <div>
      <VoltarLink href={`/dashboard/planos/${id}`} rotulo="Voltar ao plano" />
      <h1 className="text-2xl font-semibold text-slate-900">Replicar plano para outras turmas</h1>
      <p className="mt-1 text-sm text-slate-500">
        Plano de origem: <strong>{plano.titulo}</strong>
        {plano.turma ? ` · ${plano.turma}` : ""}
      </p>
      <div className="mt-6 card p-6">
        <ReplicarForm
          etapa={plano.etapa as EtapaPlano}
          turmaAtual={plano.turma}
          planoId={id}
          action={replicarComId}
        />
      </div>
    </div>
  );
}
