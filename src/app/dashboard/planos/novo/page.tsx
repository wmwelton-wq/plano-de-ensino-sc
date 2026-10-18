import CartaoIlustrado from "@/components/cartao-ilustrado";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoTopo from "@/components/navegacao-topo";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icone } from "@/components/icones";

const opcoes = [
  {
    href: "/dashboard/planos/novo/infantil",
    ilustracao: "infantil" as const,
    tom: "rosa" as const,
    titulo: "Educação Infantil",
    descricao: "Campos de experiência, por grupo etário (bebês, crianças bem pequenas e crianças pequenas).",
  },
  {
    href: "/dashboard/planos/novo/fundamental-anos-iniciais",
    ilustracao: "iniciais" as const,
    tom: "verde" as const,
    titulo: "Ensino Fundamental — Anos Iniciais",
    descricao: "1º ao 5º ano. Formulário com os quadros próprios dessa etapa.",
  },
  {
    href: "/dashboard/planos/novo/fundamental-anos-finais",
    ilustracao: "finais" as const,
    tom: "ciano" as const,
    titulo: "Ensino Fundamental — Anos Finais",
    descricao: "6º ao 9º ano. Mesmo formato do Ensino Médio, com os componentes do Fundamental.",
  },
  {
    href: "/dashboard/planos/novo/medio-tecnico",
    ilustracao: "medio" as const,
    tom: "violeta" as const,
    titulo: "Ensino Médio e Cursos Técnicos",
    descricao: "Formação Geral Básica, itinerários integrados e cursos técnicos (CEDUP).",
  },
];

export default async function EscolherEtapaPage() {
  // Planos anuais do professor: aparecem como atalho opcional para gerar os mensais a partir deles.
  const supabase = await createClient();
  const { data: anuaisBrutos } = await supabase
    .from("planos_anuais")
    .select("id, titulo, ano_letivo, turma")
    .order("updated_at", { ascending: false })
    .limit(6);
  const anuais = (anuaisBrutos ?? []) as { id: string; titulo: string; ano_letivo: number; turma: string | null }[];

  return (
    <div>
      <NavegacaoTopo
        voltarHref="/dashboard/meus-planos/mensais"
        voltarRotulo="Voltar aos planos mensais"
        migalhas={[
          { rotulo: "Início", href: "/dashboard" },
          { rotulo: "Planos mensais", href: "/dashboard/meus-planos/mensais" },
          { rotulo: "Novo plano" },
        ]}
      />
      <CabecalhoPagina
        tom="verde"
        ilustracao="novoPlano"
        titulo="Novo plano de ensino"
        subtitulo="Qual etapa de ensino é este plano? Cada etapa tem seus próprios quadros no formulário."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {opcoes.map((opcao) => (
          <CartaoIlustrado
            key={opcao.href}
            href={opcao.href}
            ilustracao={opcao.ilustracao}
            tom={opcao.tom}
            titulo={opcao.titulo}
            texto={opcao.descricao}
            altura="h-[140px]"
          />
        ))}
      </div>

      {anuais.length > 0 && (
        <section aria-labelledby="usar-anual" className="painel-cartao mt-8 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white" aria-hidden="true">
              <Icone nome="calendario" className="h-5 w-5" />
            </span>
            <div>
              <h2 id="usar-anual" className="text-base font-extrabold text-slate-900">
                Quer usar seu plano anual para ajudar no mensal?
              </h2>
              <p className="mt-0.5 text-sm text-slate-600">
                É opcional. Escolha um plano anual: você marca o trimestre e os meses, e os planos mensais já nascem com as habilidades e os objetos de conhecimento dele. Depois é só ajustar.
              </p>
            </div>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {anuais.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/dashboard/anual/${a.id}/mensal`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm transition hover:border-primary-300 hover:bg-primary-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-slate-900">{a.titulo}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {a.ano_letivo}
                      {a.turma ? ` · ${a.turma}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-primary-700">Gerar mensais →</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">Prefere começar do zero? É só escolher a etapa acima.</p>
        </section>
      )}
    </div>
  );
}
