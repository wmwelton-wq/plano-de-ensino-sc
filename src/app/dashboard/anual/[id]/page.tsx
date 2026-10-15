import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import VoltarLink from "../../planos/voltar-link";
import ExcluirButton from "../../planos/[id]/excluir-button";
import PlanoAnualForm from "../plano-anual-form";
import { atualizarPlanoAnual, excluirPlanoAnual } from "../actions";
import type { PlanoAnual } from "@/lib/plano-anual";

export default async function EditarPlanoAnualPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string }>;
}) {
  const { id } = await params;
  const { salvo } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.from("planos_anuais").select("*").eq("id", id).single();
  if (!data) notFound();
  const plano = data as PlanoAnual;

  const [{ data: disciplinas }, { data: escolas }] = await Promise.all([
    supabase.from("disciplinas").select("id, nome, area, etapa").order("nome"),
    supabase.from("escolas").select("*").order("nome"),
  ]);

  const atualizarComId = atualizarPlanoAnual.bind(null, id);
  const excluirComId = excluirPlanoAnual.bind(null, id);
  const base = `/dashboard/anual/${id}/visualizar`;
  const botao = "btn-azul !from-primary-500 !via-primary-500 !to-sky-400 !ring-white/40";

  return (
    <div>
      <VoltarLink href="/dashboard/meus-planos" rotulo="Voltar aos meus planos" />
      <div className="mt-2 overflow-hidden rounded-2xl border border-primary-200/70 bg-gradient-to-r from-primary-800 via-primary-700 to-sky-600 p-5 text-white shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Editar plano anual</h1>
            <p className="text-sm text-primary-100">{plano.titulo}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={base} className="btn-azul-suave !border-white/40 !bg-white !text-primary-700">
              Visualizar plano
            </Link>
            <Link href={`${base}?auto=salvar`} className={botao}>
              Baixar PDF
            </Link>
            <Link href={`${base}?auto=word`} className={botao}>
              Baixar Word
            </Link>
            <Link href={`${base}?auto=imprimir`} className={botao}>
              Imprimir
            </Link>
            <ExcluirButton excluirAction={excluirComId} />
          </div>
        </div>
      </div>

      {salvo && (
        <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Plano anual salvo com sucesso.
        </p>
      )}

      <div className="mt-6">
        <PlanoAnualForm
          escolas={escolas ?? []}
          disciplinas={disciplinas ?? []}
          nomeProfessor=""
          plano={plano}
          action={atualizarComId}
          textoBotao="Salvar alterações"
        />
      </div>
    </div>
  );
}
