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

interface PlanoLista {
  id: string;
  titulo: string;
  ano_letivo: number;
  turma: string | null;
  etapa: string;
  status: string;
  escolas: { nome: string; municipio: string } | { nome: string; municipio: string }[] | null;
}

function nomeDaEscola(plano: PlanoLista): string {
  const e = Array.isArray(plano.escolas) ? plano.escolas[0] : plano.escolas;
  return e?.nome ?? "Sem escola definida";
}

const comparar = (a: string, b: string) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });

/** Agrupa os planos por escola e, dentro dela, por turma (ambos em ordem alfabética/numérica). */
function agruparPlanos(planos: PlanoLista[]) {
  const porEscola = new Map<string, Map<string, PlanoLista[]>>();
  for (const plano of planos) {
    const escola = nomeDaEscola(plano);
    const turma = plano.turma?.trim() || "Sem turma definida";
    const turmas = porEscola.get(escola) ?? new Map<string, PlanoLista[]>();
    turmas.set(turma, [...(turmas.get(turma) ?? []), plano]);
    porEscola.set(escola, turmas);
  }
  // "Sem ..." vai para o fim.
  const ultimo = (nome: string) => (nome.startsWith("Sem ") ? 1 : 0);
  return Array.from(porEscola.entries())
    .sort(([a], [b]) => ultimo(a) - ultimo(b) || comparar(a, b))
    .map(([escola, turmas]) => ({
      escola,
      turmas: Array.from(turmas.entries())
        .sort(([a], [b]) => ultimo(a) - ultimo(b) || comparar(a, b))
        .map(([turma, itens]) => ({ turma, itens })),
    }));
}

function ListaPlanos({ planos, base }: { planos: PlanoLista[]; base: string }) {
  return (
    <div className="mt-4 space-y-6">
      {agruparPlanos(planos).map(({ escola, turmas }) => (
        <section key={escola}>
          <h3 className="text-lg font-bold text-slate-900">{escola}</h3>
          <div className="mt-2 space-y-3">
            {turmas.map(({ turma, itens }) => (
              <details key={turma} open className="rounded-xl border border-slate-200 bg-white/60 p-3">
                <summary className="cursor-pointer text-sm font-bold text-slate-700">
                  {turma} <span className="font-normal text-slate-400">({itens.length})</span>
                </summary>
                <ul className="mt-3 space-y-3">
                  {itens.map((plano) => (
                    <li key={plano.id}>
                      <Link
                        href={`${base}/${plano.id}`}
                        className="card card-interactive flex items-center justify-between gap-4 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{plano.titulo}</p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {etapaLabel[plano.etapa as EtapaPlano] ?? plano.etapa} · {plano.ano_letivo}
                          </p>
                        </div>
                        <span
                          className={`badge ${
                            plano.status === "finalizado" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
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
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: planos } = await supabase
    .from("planos_de_ensino")
    .select("id, titulo, ano_letivo, turma, etapa, status, updated_at, escola_id, escolas(nome, municipio)")
    .order("updated_at", { ascending: false });

  const { data: planosAnuais } = await supabase
    .from("planos_anuais")
    .select("id, titulo, ano_letivo, turma, etapa, status, updated_at, escola_id, escolas(nome, municipio)")
    .order("updated_at", { ascending: false });

  const totalMensais = planos?.length ?? 0;
  const totalAnuais = planosAnuais?.length ?? 0;
  const total = totalMensais + totalAnuais;
  const finalizados =
    (planos?.filter((p) => p.status === "finalizado").length ?? 0) +
    (planosAnuais?.filter((p: { status: string }) => p.status === "finalizado").length ?? 0);
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
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard/planos/novo" className="btn-azul">
            <span aria-hidden="true">+</span> Plano mensal
          </Link>
          <Link href="/dashboard/anual/novo" className="btn-azul">
            <span aria-hidden="true">+</span> Plano anual
          </Link>
        </div>
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

      {total === 0 ? (
        <div className="card mt-8 border-dashed p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-xl">
            📘
          </div>
          <p className="mt-4 text-slate-600">Você ainda não criou nenhum plano de ensino.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard/planos/novo" className="btn-azul">
              Criar plano mensal
            </Link>
            <Link href="/dashboard/anual/novo" className="btn-azul">
              Criar plano anual
            </Link>
          </div>
        </div>
      ) : (
        <>
          {totalAnuais > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-slate-900">Planos anuais</h2>
              <ListaPlanos planos={planosAnuais as unknown as PlanoLista[]} base="/dashboard/anual" />
            </div>
          )}
          {totalMensais > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-slate-900">Planos mensais</h2>
              <ListaPlanos planos={planos as unknown as PlanoLista[]} base="/dashboard/planos" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
