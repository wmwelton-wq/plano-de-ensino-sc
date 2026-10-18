import Link from "next/link";
import { VIDEOS_AJUDA, VIDEOS_SUGERIDOS, enderecoIncorporado } from "@/lib/ajuda-videos";
import { Icone } from "@/components/icones";
import { Ilustracao, type NomeIlustracao } from "@/components/ilustracoes";
import ReiniciarTutorial from "./reiniciar-tutorial";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import NavegacaoTopo from "@/components/navegacao-topo";

const PASSOS = [
  {
    ilustracao: "escola" as NomeIlustracao,
    tom: "ambar",
    titulo: "1. Cadastre sua escola",
    texto: "Em Escolas → Cadastrar escola, informe o nome, o município e (se quiser) a logo. Ela aparece no cabeçalho dos seus planos.",
    href: "/dashboard/escolas/nova",
    link: "Cadastrar escola",
  },
  {
    ilustracao: "anual" as NomeIlustracao,
    tom: "azul",
    titulo: "2. Faça o plano anual",
    texto: "Feito uma vez por ano: escolha o componente, a turma e marque habilidades e objetos de conhecimento de cada trimestre.",
    href: "/dashboard/anual/novo",
    link: "Cadastrar plano anual",
  },
  {
    ilustracao: "mensal" as NomeIlustracao,
    tom: "verde",
    titulo: "3. Gere os planos mensais",
    texto: "Dentro do plano anual, use “Gerar planos mensais deste plano”. O app sugere os meses e já distribui os conteúdos.",
    href: "/dashboard/meus-planos/anuais",
    link: "Ver planos anuais",
  },
  {
    ilustracao: "meusPlanos" as NomeIlustracao,
    tom: "violeta",
    titulo: "4. Baixe ou imprima",
    texto: "Em cada plano há PDF, Word e Imprimir. Nas pastas de escola e turma você baixa vários planos de uma vez, em um único PDF.",
    href: "/dashboard/meus-planos",
    link: "Meus planos",
  },
];

const DICAS = [
  "Seu trabalho é guardado como rascunho neste aparelho enquanto você digita no plano anual; se a página fechar sem querer, o app oferece restaurar.",
  "Use a estrela para marcar os planos que você está usando agora: eles aparecem em destaque na página Início.",
  "Na página Início, a caixa de busca encontra planos pelo título, pela escola ou pela turma.",
  "O botão “Conferir agora” do plano anual avisa o que está faltando antes de finalizar. Ele só avisa — não muda o formato do plano.",
];

export default function AjudaPage() {
  return (
    <div>
      <NavegacaoTopo
        voltarHref="/dashboard"
        voltarRotulo="Voltar ao início"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Ajuda" }]}
      />
      <CabecalhoPagina
        tom="ciano"
        ilustracao="ajuda"
        titulo="Ajuda"
        subtitulo="Um passo a passo curto para começar e algumas dicas para ganhar tempo."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PASSOS.map((p) => (
          <div key={p.titulo} data-tom={p.tom} className="atalho-ilustrado flex flex-col sm:flex-row">
            <div className="atalho-arte h-[120px] shrink-0 px-3 py-2.5 sm:h-auto sm:w-[40%]">
              <Ilustracao nome={p.ilustracao} tom={p.tom as "ambar" | "azul" | "verde" | "violeta"} />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h2 className="text-base font-extrabold text-slate-900">{p.titulo}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{p.texto}</p>
              <Link href={p.href} className="link-primary mt-3 inline-flex items-center gap-1 text-sm font-semibold">
                {p.link}
                <Icone nome="setaDireita" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <span data-tom="ambar" className="flex h-10 w-10 items-center justify-center rounded-2xl [background:var(--tom-claro)] [color:var(--tom)]" aria-hidden="true">
          <Icone nome="lampada" className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Dicas para ganhar tempo</h2>
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DICAS.map((d) => (
          <li key={d} className="painel-cartao flex gap-3 p-4 text-sm leading-relaxed text-slate-700">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden="true">
              <Icone nome="check" className="h-3.5 w-3.5" />
            </span>
            <span>{d}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Vídeos curtos</h2>
      {VIDEOS_AJUDA.length === 0 ? (
        <div className="card mt-3 p-5 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Vídeos em breve.</p>
          <p className="mt-1">Vamos gravar vídeos de 1 a 2 minutos sobre:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {VIDEOS_SUGERIDOS.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {VIDEOS_AJUDA.map((v) => {
            const incorporado = enderecoIncorporado(v.url);
            return (
              <div key={v.url} className="card overflow-hidden">
                {incorporado ? (
                  <iframe
                    src={incorporado}
                    title={v.titulo}
                    loading="lazy"
                    className="aspect-video w-full"
                    allow="accelerometer; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={v.url} controls preload="metadata" className="aspect-video w-full bg-black" />
                )}
                <p className="p-3 text-sm font-semibold text-slate-800">
                  {v.titulo}
                  {v.duracao ? <span className="font-normal text-slate-500"> · {v.duracao}</span> : null}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <ReiniciarTutorial />
        <Link href="/dashboard/opiniao" className="btn-azul-suave">
          Dar minha opinião
        </Link>
      </div>
    </div>
  );
}
