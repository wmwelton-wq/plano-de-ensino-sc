import type { ReactNode } from "react";
import { Icone, type NomeIcone } from "@/components/icones";
import { Ilustracao, type NomeIlustracao } from "@/components/ilustracoes";

export type TomPagina = "azul" | "verde" | "violeta" | "ambar" | "ciano" | "ardosia" | "rosa";

/** Ilustração usada quando a página não escolhe uma: segue a cor do assunto, como no painel. */
const ILUSTRACAO_DA_COR: Record<TomPagina, NomeIlustracao> = {
  azul: "anual",
  verde: "mensal",
  violeta: "turma",
  ambar: "escola",
  ciano: "ajuda",
  ardosia: "meusPlanos",
  rosa: "opiniao",
};

/**
 * Cabeçalho das páginas internas: faixa ilustrada igual à do painel inicial, com o título à esquerda
 * e o desenho do assunto à direita. A cor identifica o tipo de plano (anual = azul, mensal = verde...).
 */
export default function CabecalhoPagina({
  tom = "azul",
  icone,
  ilustracao,
  titulo,
  subtitulo,
  acoes,
  rodape,
  compacto = false,
}: {
  tom?: TomPagina;
  icone?: NomeIcone;
  ilustracao?: NomeIlustracao;
  titulo: string;
  subtitulo?: ReactNode;
  /** Botões abaixo do título. */
  acoes?: ReactNode;
  /** Segunda linha de botões (abaixo de uma linha divisória). */
  rodape?: ReactNode;
  /** Faixa mais baixa, para telas de formulário longas. */
  compacto?: boolean;
}) {
  const arte = ilustracao ?? ILUSTRACAO_DA_COR[tom];
  return (
    <header className="cabecalho-pagina painel-entra" data-tom={tom}>
      <div className={`relative flex items-center justify-between gap-3 px-5 sm:gap-6 sm:px-7 ${compacto ? "py-4 sm:py-5" : "py-5 sm:py-7"}`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3.5">
            {icone && (
              <span className="cabecalho-icone hidden sm:flex" aria-hidden="true">
                <Icone nome={icone} className="h-6 w-6" />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-[1.7rem]">{titulo}</h1>
              {subtitulo && <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-[0.95rem]">{subtitulo}</p>}
            </div>
          </div>
          {acoes && <div className="mt-4 flex flex-wrap items-center gap-2">{acoes}</div>}
        </div>
        <div className={`cabecalho-arte shrink-0 ${compacto ? "h-20 w-28 sm:h-28 sm:w-44" : "h-24 w-32 sm:h-36 sm:w-56"}`} aria-hidden="true">
          <Ilustracao nome={arte} tom={tom} />
        </div>
      </div>
      {rodape && <div className="relative flex flex-wrap items-center gap-2 border-t border-slate-200/80 bg-white/70 px-5 py-3 sm:px-7">{rodape}</div>}
    </header>
  );
}
