import Link from "next/link";
import { VIDEOS_AJUDA, VIDEOS_SUGERIDOS, enderecoIncorporado } from "@/lib/ajuda-videos";
import { Icone, type NomeIcone } from "@/components/icones";
import ReiniciarTutorial from "./reiniciar-tutorial";

const PASSOS = [
  {
    icone: "escola" as NomeIcone,
    tom: "ambar",
    titulo: "1. Cadastre sua escola",
    texto: "Em Escolas → Cadastrar escola, informe o nome, o município e (se quiser) a logo. Ela aparece no cabeçalho dos seus planos.",
    href: "/dashboard/escolas/nova",
    link: "Cadastrar escola",
  },
  {
    icone: "calendario" as NomeIcone,
    tom: "azul",
    titulo: "2. Faça o plano anual",
    texto: "Feito uma vez por ano: escolha o componente, a turma e marque habilidades e objetos de conhecimento de cada trimestre.",
    href: "/dashboard/anual/novo",
    link: "Cadastrar plano anual",
  },
  {
    icone: "livro" as NomeIcone,
    tom: "verde",
    titulo: "3. Gere os planos mensais",
    texto: "Dentro do plano anual, use “Gerar planos mensais deste plano”. O app sugere os meses e já distribui os conteúdos.",
    href: "/dashboard/meus-planos/anuais",
    link: "Ver planos anuais",
  },
  {
    icone: "baixar" as NomeIcone,
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
      <h1 className="text-2xl font-semibold text-slate-900">Ajuda</h1>
      <p className="mt-2 text-sm text-slate-600">Um passo a passo curto para começar e algumas dicas para ganhar tempo.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PASSOS.map((p) => (
          <div key={p.titulo} data-tom={p.tom} className="card border-l-4 p-5 [border-left-color:var(--tom)]">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg [background:var(--tom-claro)] [color:var(--tom)]" aria-hidden="true">
                <Icone nome={p.icone} className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">{p.titulo}</h2>
                <p className="mt-1 text-sm text-slate-600">{p.texto}</p>
                <Link href={p.href} className="link-primary mt-2 inline-block text-sm font-semibold">
                  {p.link} →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Dicas</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
        {DICAS.map((d) => (
          <li key={d}>{d}</li>
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
