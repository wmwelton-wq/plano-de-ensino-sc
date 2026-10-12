// Geometria da página e estilo de texto do plano de ensino, compartilhados
// pela visualização, pela impressão e pelo PDF — assim os três saem iguais.

/** Arial (ou a fonte de mesmas medidas disponível no sistema). */
export const FAMILIA_FONTE = 'Arial, "Liberation Sans", Helvetica, sans-serif';

/** Estilo do texto do plano: Arial 10,5 pt (14 px) com entrelinha de 15 pt (20 px), igual ao arquivo Word. */
export const ESTILO_TEXTO_PLANO = {
  fontFamily: FAMILIA_FONTE,
  fontSize: "14px",
  lineHeight: "20px",
  color: "#000",
} as const;

export const ESTILO_TEXTO_PLANO_CSS = `font-family:${FAMILIA_FONTE};font-size:14px;line-height:20px;color:#000;`;

export const PX_POR_MM = 96 / 25.4;
/** Margem esquerda e direita (2 cm). */
export const MARGEM_LATERAL_MM = 20;
/** Margem de cima e de baixo de cada página (1,5 cm). */
export const MARGEM_VERTICAL_MM = 15;

export interface GeometriaPagina {
  paginaLarguraMm: number;
  paginaAlturaMm: number;
  conteudoLarguraMm: number;
  conteudoAlturaMm: number;
  /** Largura da área de texto, em px (96 dpi). */
  larguraPx: number;
  /** Altura útil por página, em px, já com uma pequena folga de segurança. */
  alturaUtilPx: number;
}

export function geometriaPagina(paisagem: boolean): GeometriaPagina {
  const paginaLarguraMm = paisagem ? 297 : 210;
  const paginaAlturaMm = paisagem ? 210 : 297;
  const conteudoLarguraMm = paginaLarguraMm - 2 * MARGEM_LATERAL_MM;
  const conteudoAlturaMm = paginaAlturaMm - 2 * MARGEM_VERTICAL_MM;
  return {
    paginaLarguraMm,
    paginaAlturaMm,
    conteudoLarguraMm,
    conteudoAlturaMm,
    larguraPx: Math.round(conteudoLarguraMm * PX_POR_MM),
    alturaUtilPx: Math.floor(conteudoAlturaMm * PX_POR_MM) - 8,
  };
}
