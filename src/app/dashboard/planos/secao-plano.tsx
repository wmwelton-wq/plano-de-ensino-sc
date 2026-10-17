import type { ReactNode } from "react";
import { Icone, type NomeIcone } from "@/components/icones";

export type TomSecao = "azul" | "verde" | "violeta" | "ambar" | "ciano" | "ardosia" | "rosa";

interface SecaoPlanoProps {
  /** Âncora usada pela barra de passos (ex.: "passo-3"). */
  id: string;
  numero: number;
  titulo: string;
  /** Frase curta que explica o que fazer neste passo. */
  descricao?: string;
  /** Cor do bloco (cada tipo de passo tem a sua, sempre a mesma). */
  tom?: TomSecao;
  /** Ícone no lugar do número. */
  icone?: NomeIcone;
  /** Passo que não está na vez no fluxo: continua na página (nada se perde), só fica escondido. */
  oculto?: boolean;
  children: ReactNode;
}

/**
 * Uma etapa do formulário do plano: o título fica numa faixa colorida (fácil de
 * achar e não se mistura com os campos) e os campos ficam logo abaixo dela.
 */
export default function SecaoPlano({ id, numero, titulo, descricao, tom = "azul", icone, oculto = false, children }: SecaoPlanoProps) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="secao-plano" data-tom={tom} hidden={oculto}>
      <header className="secao-cabecalho">
        <span className="secao-numero" aria-hidden="true">
          {icone ? <Icone nome={icone} className="h-5 w-5" /> : <span className="text-sm font-bold">{numero}</span>}
        </span>
        <div>
          <h2 id={`${id}-titulo`} className="text-base font-bold leading-tight">
            {titulo}
          </h2>
          {descricao && <p className="mt-0.5 text-xs font-normal text-slate-600">{descricao}</p>}
        </div>
      </header>
      <div className="secao-corpo">{children}</div>
    </section>
  );
}
