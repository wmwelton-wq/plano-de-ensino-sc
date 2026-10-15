import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VoltarLink from "../../../planos/voltar-link";
import DuplicarForm from "./duplicar-form";
import { duplicarPlanoAnual } from "../../actions";

export default async function DuplicarPlanoAnualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: plano }, { data: escolas }] = await Promise.all([
    supabase.from("planos_anuais").select("id, titulo, turma, escola_id, ano_letivo, componente").eq("id", id).single(),
    supabase.from("escolas").select("id, nome, municipio").order("nome"),
  ]);
  if (!plano) notFound();
  const p = plano as { titulo: string; turma: string | null; escola_id: string | null; ano_letivo: number };

  return (
    <div>
      <VoltarLink href={`/dashboard/anual/${id}`} rotulo="Voltar ao plano" />
      <div className="mt-2 overflow-hidden rounded-2xl bg-gradient-to-r from-primary-800 via-primary-700 to-sky-600 p-5 text-white shadow-glow">
        <h1 className="text-2xl font-semibold">Duplicar plano anual para outra turma</h1>
        <p className="mt-1 text-sm text-primary-100">
          Plano de origem: <strong>{p.titulo}</strong>
        </p>
      </div>
      <div className="mt-6">
        <DuplicarForm
          escolas={(escolas ?? []) as { id: string; nome: string; municipio: string }[]}
          escolaInicial={p.escola_id}
          anoInicial={p.ano_letivo}
          turmaOrigem={p.turma}
          action={duplicarPlanoAnual.bind(null, id)}
        />
      </div>
    </div>
  );
}
