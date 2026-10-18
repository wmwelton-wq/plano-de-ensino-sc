import { Icone } from "@/components/icones";
import { Ilustracao } from "@/components/ilustracoes";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoTopo from "@/components/navegacao-topo";
import { TIPOS, type TipoPlano } from "./dados";

export default async function MeusPlanosPage() {
  const supabase = await createClient();
  // Só os totais: contagem no banco, sem baixar nenhum plano.
  const [mensais, anuais] = await Promise.all([
    supabase.from(TIPOS.mensais.tabela).select("id", { count: "exact", head: true }),
    supabase.from(TIPOS.anuais.tabela).select("id", { count: "exact", head: true }),
  ]);
  const total: Record<TipoPlano, number> = { mensais: mensais.count ?? 0, anuais: anuais.count ?? 0 };

  return (
    <div>
      <NavegacaoTopo
        voltarHref="/dashboard"
        voltarRotulo="Voltar ao início"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Meus planos" }]}
      />
      <CabecalhoPagina
        tom="azul"
        ilustracao="meusPlanos"
        titulo="Meus planos"
        subtitulo="Escolha o tipo de plano. Depois você escolhe a escola e a turma."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(Object.keys(TIPOS) as TipoPlano[]).map((tipo) => (
          <div key={tipo} data-tom={tipo === "anuais" ? "azul" : "verde"} className="atalho-ilustrado flex flex-col">
            <div className="atalho-arte relative h-[150px] px-4 py-3">
              <Ilustracao nome={tipo === "anuais" ? "anual" : "mensal"} tom={tipo === "anuais" ? "azul" : "verde"} />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold shadow-sm [color:var(--tom)]">
                {total[tipo]} {total[tipo] === 1 ? "plano" : "planos"}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-4 p-5">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{TIPOS[tipo].titulo}</h2>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link href={`/dashboard/meus-planos/${tipo}`} className="btn-azul">
                  Ver {TIPOS[tipo].titulo.toLowerCase()}
                </Link>
                <Link href={TIPOS[tipo].novo} className="btn-azul-suave">
                  <Icone nome="mais" className="h-4 w-4" />
                  Novo {TIPOS[tipo].singular}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
