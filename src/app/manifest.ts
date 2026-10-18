import type { MetadataRoute } from "next";

/** Permite instalar o Plano Docente como aplicativo no celular (Android/Chrome) e na tela inicial. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Plano Docente",
    short_name: "Plano Docente",
    description: "Planos de ensino anuais e mensais para professores de Santa Catarina.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
