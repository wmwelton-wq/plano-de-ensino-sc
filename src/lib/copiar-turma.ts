// Utilidades para copiar um plano para outras turmas (sem DOM, sem Supabase).

/** Monta o nome da turma: "7º Ano" + "B" => "7º Ano B". */
export function montarTurma(serie: string, ident: string): string {
  return [serie.trim(), ident.trim()].filter(Boolean).join(" ").trim();
}

/**
 * Título sugerido para a cópia: se o título do plano original cita a turma original, troca pela nova;
 * senão acrescenta " — turma" no fim.
 */
export function tituloParaTurma(tituloOrigem: string, turmaOrigem: string | null, turmaNova: string): string {
  const titulo = tituloOrigem.trim();
  const origem = (turmaOrigem ?? "").trim();
  const nova = turmaNova.trim();
  if (!nova) return titulo;
  if (origem && titulo.toLowerCase().includes(origem.toLowerCase())) {
    const i = titulo.toLowerCase().indexOf(origem.toLowerCase());
    return titulo.slice(0, i) + nova + titulo.slice(i + origem.length);
  }
  if (titulo.toLowerCase().includes(nova.toLowerCase())) return titulo;
  return `${titulo} — ${nova}`;
}
