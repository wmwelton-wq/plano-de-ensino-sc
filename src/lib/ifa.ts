/**
 * IFA (Ensino Médio): link da pasta do Drive onde o professor guarda as evidências/atividades do plano.
 * O link informado pode ser "lembrado" por disciplina (tabela ifa_sugestoes) e sugerido nos próximos planos.
 */

export const IFA_MAX = 500;

/** Aceita só endereços https (o link vira clicável no plano). Devolve o texto limpo, null se vazio ou { erro }. */
export function lerIfaLink(bruto: unknown): { link: string | null; erro?: string } {
  const texto = typeof bruto === "string" ? bruto.trim() : "";
  if (!texto) return { link: null };
  if (texto.length > IFA_MAX) return { link: null, erro: "O link do IFA é muito longo." };
  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return { link: null, erro: "O link do IFA não parece um endereço válido. Cole o link completo do Drive (começa com https://)." };
  }
  if (url.protocol !== "https:") {
    return { link: null, erro: "O link do IFA precisa começar com https://." };
  }
  return { link: url.toString() };
}

/** Sugestões já salvas pelo professor: { disciplina_id: url }. Em erro, devolve vazio (o campo continua funcionando). */
export async function carregarSugestoesIfa(cliente: unknown): Promise<Record<string, string>> {
  const supabase = cliente as {
    from: (t: string) => { select: (c: string) => PromiseLike<{ data: { disciplina_id: string; url: string }[] | null; error: unknown }> };
  };
  try {
    const { data, error } = await supabase.from("ifa_sugestoes").select("disciplina_id, url");
    if (error || !data) return {};
    return Object.fromEntries(data.map((l) => [l.disciplina_id, l.url]));
  } catch {
    return {};
  }
}
