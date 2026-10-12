import type { ReactNode } from "react";

interface SecaoPlanoProps {
  /** Âncora usada pela barra de passos (ex.: "passo-3"). */
  id: string;
  numero: number;
  titulo: string;
  /** Frase curta que explica o que fazer neste passo. */
  descricao?: string;
  children: ReactNode;
}

/**
 * Uma etapa do formulário do plano: o título fica numa caixa azul (fácil de
 * achar e não se mistura com os campos) e os campos ficam logo abaixo dela.
 */
export default function SecaoPlano({ id, numero, titulo, descricao, children }: SecaoPlanoProps) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="secao-plano">
      <header className="secao-cabecalho">
        <span className="secao-numero" aria-hidden="true">
          {numero}
        </span>
        <div className="relative z-10">
          <h2 id={`${id}-titulo`} className="text-base font-semibold leading-tight">
            {titulo}
          </h2>
          {descricao && <p className="mt-0.5 text-xs text-primary-100">{descricao}</p>}
        </div>
      </header>
      <div className="secao-corpo">{children}</div>
    </section>
  );
}
