import { Icone } from "@/components/icones";
import { VIDEO_CAPA, VIDEO_URL } from "./config-landing";

/** Converte links do YouTube/Vimeo no endereço de "incorporar". Devolve null para outros links. */
function enderecoIncorporado(url: string): string | null {
  try {
    const u = new URL(url, "https://planodocente.com.br");
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return `https://www.youtube.com${u.pathname}`;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    /* link inválido: cai no aviso "em breve" */
  }
  return null;
}

export default function VideoDemo() {
  const url = VIDEO_URL.trim();
  const incorporado = url ? enderecoIncorporado(url) : null;
  const ehArquivo = !!url && !incorporado && /\.(mp4|webm|ogg)$/i.test(url);

  return (
    <div className="ld-video">
      {incorporado ? (
        <iframe
          src={incorporado}
          title="Vídeo: como funciona o Plano Docente"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full"
        />
      ) : ehArquivo ? (
        <video className="absolute inset-0 h-full w-full object-cover" controls preload="metadata" poster={VIDEO_CAPA || undefined}>
          <source src={url} />
          Seu navegador não consegue reproduzir este vídeo.
        </video>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <span className="ld-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-8 w-8 translate-x-0.5" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
          </span>
          <div>
            <p className="text-lg font-extrabold text-white sm:text-xl">Vídeo em breve</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-blue-100/90">Em poucos minutos você vai ver, na prática, como montar um plano de ensino do começo ao PDF.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
            <Icone nome="olho" className="h-3.5 w-3.5" /> Demonstração do aplicativo
          </span>
        </div>
      )}
    </div>
  );
}
