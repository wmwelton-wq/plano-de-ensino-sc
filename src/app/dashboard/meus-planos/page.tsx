import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Migalhas, TIPOS, carregarPlanos, type TipoPlano } from "./dados";

export default async function MeusPlanosPage() {
  const supabase = await createClient();
  const [mensais, anuais] = await Promise.all([carregarPlanos(supabase, "mensais"), carregarPlanos(supabase, "anuais")]);
  const total: Record<TipoPlano, number> = { mensais: mensais.length, anuais: anuais.length };

  return (
    <div>
      <Migalhas itens={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Meus planos" }]} />
      <h1 className="text-2xl font-semibold text-slate-900">Meus planos</h1>
      <p className="mt-1 text-sm text-slate-500">Escolha o tipo de plano. Depois você escolhe a escola e a turma.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(Object.keys(TIPOS) as TipoPlano[]).map((tipo) => (
          <div key={tipo} className="card flex flex-col gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-2xl" aria-hidden="true">
                {tipo === "anuais" ? "📅" : "🗓️"}
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{TIPOS[tipo].titulo}</h2>
                <p className="text-sm text-slate-500">
                  {total[tipo]} {total[tipo] === 1 ? "plano" : "planos"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/meus-planos/${tipo}`} className="btn-azul">
                Ver {TIPOS[tipo].titulo.toLowerCase()}
              </Link>
              <Link href={TIPOS[tipo].novo} className="btn-azul-suave !border-2 !border-primary-500">
                + Novo {TIPOS[tipo].singular}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
