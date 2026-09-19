import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { PlanoDeEnsino } from "@/lib/database.types";

const statusLabel: Record<PlanoDeEnsino["status"], string> = {
  rascunho: "Rascunho",
  finalizado: "Finalizado",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: planos } = await supabase
    .from("planos_de_ensino")
    .select("id, titulo, ano_letivo, turma, status, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Meus planos de ensino</h1>
        <Link
          href="/dashboard/planos/novo"
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          + Novo plano
        </Link>
      </div>

      {!planos || planos.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">Você ainda não criou nenhum plano de ensino.</p>
          <Link
            href="/dashboard/planos/novo"
            className="mt-4 inline-block font-medium text-primary-600 hover:underline"
          >
            Criar o primeiro plano
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {planos.map((plano) => (
            <li key={plano.id}>
              <Link
                href={`/dashboard/planos/${plano.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{plano.titulo}</p>
                  <p className="text-sm text-slate-500">
                    {plano.ano_letivo}
                    {plano.turma ? ` · Turma ${plano.turma}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    plano.status === "finalizado"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
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
