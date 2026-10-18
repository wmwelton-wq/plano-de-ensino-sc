import Link from "next/link";
import { Icone, type NomeIcone } from "@/components/icones";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoTopo from "@/components/navegacao-topo";

const opcoes = [
  {
    href: "/dashboard/planos/novo/infantil",
    icone: "coracao" as NomeIcone,
    tom: "rosa",
    titulo: "Educação Infantil",
    descricao: "Campos de experiência, por grupo etário (bebês, crianças bem pequenas e crianças pequenas).",
  },
  {
    href: "/dashboard/planos/novo/fundamental-anos-iniciais",
    icone: "lapis" as NomeIcone,
    tom: "verde",
    titulo: "Ensino Fundamental — Anos Iniciais",
    descricao: "1º ao 5º ano. Formulário com os quadros próprios dessa etapa.",
  },
  {
    href: "/dashboard/planos/novo/fundamental-anos-finais",
    icone: "bussola" as NomeIcone,
    tom: "ciano",
    titulo: "Ensino Fundamental — Anos Finais",
    descricao: "6º ao 9º ano. Mesmo formato do Ensino Médio, com os componentes do Fundamental.",
  },
  {
    href: "/dashboard/planos/novo/medio-tecnico",
    icone: "graduacao" as NomeIcone,
    tom: "violeta",
    titulo: "Ensino Médio e Cursos Técnicos",
    descricao: "Formação Geral Básica, itinerários integrados e cursos técnicos (CEDUP).",
  },
];

export default function EscolherEtapaPage() {
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
        icone="livro"
        titulo="Novo plano de ensino"
        subtitulo="Qual etapa de ensino é este plano? Cada etapa tem seus próprios quadros no formulário."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {opcoes.map((opcao) => (
          <Link
            key={opcao.href}
            href={opcao.href}
            data-tom={opcao.tom}
            className="card card-interactive group p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl [background:var(--tom-claro)] [color:var(--tom)]">
              <Icone nome={opcao.icone} className="h-6 w-6" />
            </div>
            <p className="mt-3 font-bold text-slate-900">{opcao.titulo}</p>
            <p className="mt-1 text-sm text-slate-600">{opcao.descricao}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
