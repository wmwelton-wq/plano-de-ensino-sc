import type { ReactNode } from "react";
import { Icone, type NomeIcone } from "@/components/icones";

export type TomPagina = "azul" | "verde" | "violeta" | "ambar" | "ciano" | "ardosia" | "rosa";

/**
 * Cabeçalho das páginas internas: cartão branco com uma faixa colorida na lateral e o ícone do assunto.
 * A cor identifica o tipo de plano (anual = azul, mensal = verde, etc.), sempre a mesma em todo o sistema.
 */
export default function CabecalhoPagina({
  tom = "azul",
  icone,
  titulo,
  subtitulo,
  acoes,
  rodape,
}: {
  tom?: TomPagina;
  icone: NomeIcone;
  titulo: string;
  subtitulo?: ReactNode;
  /** Botões à direita do título. */
  acoes?: ReactNode;
  /** Segunda linha de botões (abaixo de uma linha divisória). */
  rodape?: ReactNode;
}) {
  return (
    <header className="cabecalho-pagina" data-tom={tom}>
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3.5">
          <span className="cabecalho-icone" aria-hidden="true">
            <Icone nome={icone} className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{titulo}</h1>
            {subtitulo && <p className="mt-0.5 text-sm text-slate-600">{subtitulo}</p>}
          </div>
        </div>
        {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>
      {rodape && <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">{rodape}</div>}
    </header>
  );
}
