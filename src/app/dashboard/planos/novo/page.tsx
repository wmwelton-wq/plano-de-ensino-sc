import Link from "next/link";
import { Icone, type NomeIcone } from "@/components/icones";

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
      <h1 className="text-2xl font-semibold text-slate-900">Novo plano de ensino</h1>
      <p className="mt-2 text-sm text-slate-600">
        Qual etapa de ensino é este plano? Cada etapa tem seus próprios quadros no formulário.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {opcoes.map((opcao) => (
          <Link
            key={opcao.href}
            href={opcao.href}
            data-tom={opcao.tom}
            className="card card-interactive border-t-4 p-5 [border-top-color:var(--tom)]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg [background:var(--tom-claro)] [color:var(--tom)]">
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
