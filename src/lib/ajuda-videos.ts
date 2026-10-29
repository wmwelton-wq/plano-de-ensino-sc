// Vídeos curtos de ajuda. Para publicar um vídeo, acrescente um item abaixo com o
// endereço do vídeo (YouTube "não listado", Vimeo, ou arquivo .mp4 hospedado).
// Enquanto a lista estiver vazia, a página de Ajuda mostra "vídeos em breve".
//
// Exemplo:
//   { titulo: "Como criar o plano anual", duracao: "2 min", url: "https://www.youtube.com/watch?v=XXXXXXXXXXX" },

export interface VideoAjuda {
  titulo: string;
  duracao?: string;
  url: string;
}

export const VIDEOS_AJUDA: VideoAjuda[] = [];

/** Títulos sugeridos para gravar (cada um com 1–2 minutos). */
export const VIDEOS_SUGERIDOS: string[] = [
  "Cadastrar minha escola e a logo",
  "Criar um plano anual passo a passo",
  "Gerar os planos mensais a partir do anual",
  "Duplicar um plano para outra turma",
  "Baixar o PDF e o Word, e baixar vários planos de uma vez",
];

/** Converte endereços do YouTube/Vimeo para o formato de incorporação; devolve null se não reconhecer. */
export function enderecoIncorporado(url: string): string | null {
  try {
    const u = new URL(url);
    if ((u.hostname === "youtube.com" || u.hostname.endsWith(".youtube.com"))) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if ((u.hostname === "vimeo.com" || u.hostname.endsWith(".vimeo.com"))) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${encodeURIComponent(id)}` : null;
    }
  } catch {
    return null;
  }
  return null;
}
