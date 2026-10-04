import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { PlanoDeEnsino, EtapaPlano } from "@/lib/database.types";

const statusLabel: Record<PlanoDeEnsino["status"], string> = {
  rascunho: "Rascunho",
  finalizado: "Finalizado",
};

const etapaLabel: Record<EtapaPlano, string> = {
  educacao_infantil: "Educação Infantil",
  fundamental_anos_iniciais: "Fundamental — Anos Iniciais",
  fundamental_anos_finais: "Fundamental — Anos Finais",
  ensino_medio: "Ensino Médio / Técnico",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: planos } = await supabase
    .from("planos_de_ensino")
    .select("id, titulo, ano_letivo, turma, etapa, status, updated_at")
    .order("updated_at", { ascending: false });

  const total = planos?.length ?? 0;
  const finalizados = planos?.filter((p) => p.status === "finalizado").length ?? 0;
  const rascunhos = total - finalizados;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Meus planos de ensino</h1>
          <p className="mt-1 text-sm text-slate-500">
            Organize, edite e exporte os planos das suas disciplinas e cursos técnicos.
          </p>
        </div>
        <Link href="/dashboard/planos/novo" className="btn-primary">
          <span aria-hidden="true">+</span> Novo plano
        </Link>
      </div>

      {total > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="text-sm text-slate-500">Total de planos</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{total}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-500">Finalizados</p>
            <p className="mt-1 text-2xl font-semibold text-green-700">{finalizados}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-500">Em rascunho</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">{rascunhos}</p>
          </div>
        </div>
      )}

      {!planos || planos.length === 0 ? (
        <div className="card mt-8 border-dashed p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-xl">
            📘
          </div>
          <p className="mt-4 text-slate-600">Você ainda não criou nenhum plano de ensino.</p>
          <Link href="/dashboard/planos/novo" className="link-primary mt-4 inline-block">
            Criar o primeiro plano
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {planos.map((plano) => (
            <li key={plano.id}>
              <Link
                href={`/dashboard/planos/${plano.id}`}
                className="card card-interactive flex items-center justify-between gap-4 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <div>
                  <p className="font-medium text-slate-900">{plano.titulo}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {etapaLabel[plano.etapa as EtapaPlano] ?? plano.etapa} · {plano.ano_letivo}
                    {plano.turma ? ` · Turma ${plano.turma}` : ""}
                  </p>
                </div>
                <span
                  className={`badge ${
                    plano.status === "finalizado"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      plano.status === "finalizado" ? "bg-green-600" : "bg-amber-600"
                    }`}
                  />
                  {statusLabel[plano.status as PlanoDeEnsino["status"]] ?? plano.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
