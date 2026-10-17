// Referências oficiais do plano mensal e a regra de como o campo "Referências" é gravado.
//
// Modo automático (padrão): o plano gerado mostra as referências oficiais e, depois delas,
// o que o professor digitou como complementar.
// Modo completo: o professor clicou em "Adicionar referências sugeridas" — elas passam a ficar
// visíveis no próprio quadro, onde podem ser editadas ou apagadas. Para o plano não repetir
// nada, o texto gravado começa com uma linha-marcador (que o professor não vê) e o plano
// mostra exatamente o que está no quadro.

export const MARCADOR_REFERENCIAS = "[[referencias-completas]]";

export function referenciasOficiais(etapa: string, usarCurriculoDigital: boolean): string[] {
  const ehFundamentalOuInfantil =
    etapa === "educacao_infantil" ||
    etapa === "fundamental_anos_iniciais" ||
    etapa === "fundamental_anos_finais";

  const refs = [
    "BRASIL. Ministério da Educação. Base Nacional Comum Curricular (BNCC). Brasília: MEC, 2018.",
    ehFundamentalOuInfantil
      ? "SANTA CATARINA. Secretaria de Estado da Educação. Currículo Base da Educação Infantil e do Ensino Fundamental do Território Catarinense. Florianópolis: SED/SC, 2019."
      : "SANTA CATARINA. Secretaria de Estado da Educação. Currículo Catarinense. Florianópolis: SED/SC, 2019.",
  ];
  if (usarCurriculoDigital) {
    refs.push(
      "SANTA CATARINA. Secretaria de Estado da Educação. Currículo de Educação Digital de Santa Catarina. Florianópolis: SED/SC."
    );
  }
  return refs;
}

/** Separa o marcador do texto gravado: devolve se está no modo completo e o texto que o professor vê. */
export function lerReferenciasGravadas(valor: string | null | undefined): { completo: boolean; texto: string } {
  const v = valor ?? "";
  if (v.startsWith(MARCADOR_REFERENCIAS)) {
    return { completo: true, texto: v.slice(MARCADOR_REFERENCIAS.length).replace(/^\r?\n/, "") };
  }
  return { completo: false, texto: v };
}

/** Texto a gravar: no modo completo, com a linha-marcador na frente. */
export function referenciasParaGravar(texto: string, completo: boolean): string {
  return completo ? `${MARCADOR_REFERENCIAS}\n${texto}` : texto;
}
