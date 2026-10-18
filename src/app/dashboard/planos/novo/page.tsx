import CartaoIlustrado from "@/components/cartao-ilustrado";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoTopo from "@/components/navegacao-topo";

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
    </div>
  );
}
