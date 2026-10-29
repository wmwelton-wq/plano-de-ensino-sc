/** @type {import('next').NextConfig} */
const nextConfig = {
  // O plano anual pode levar imagens coladas no texto livre (já reduzidas no
  // navegador): o limite padrão de 1 MB das ações do servidor seria pequeno.
  // 4 MB fica abaixo do teto de 4,5 MB das funções da Vercel.
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  // Cabeçalhos de segurança aplicados a toda resposta. Adicionados na
  // auditoria de segurança: o app já tinha RLS, verificação dupla de sessão
  // (proxy + layout) e Cache-Control correto contra vazamento de sessão via
  // CDN — isso aqui fecha a camada de cabeçalhos HTTP, que estava ausente.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Nunca permite que o site seja carregado dentro de um <iframe> de
          // outro domínio (evita clickjacking sobre login/dashboard).
          { key: "X-Frame-Options", value: "DENY" },
          // Impede que o navegador tente "adivinhar" o tipo de um arquivo
          // (mitigação clássica contra certos ataques de XSS via upload).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Não envia a URL completa (que pode conter tokens em query string)
          // como Referer ao navegar para sites de terceiros.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Força HTTPS em todas as visitas futuras por 2 anos, incluindo
          // subdomínios, e permite inclusão na lista de preload dos navegadores.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Content-Security-Policy EFETIVA (antes era só Report-Only). Bloqueia scripts, quadros e
          // conexões de origens fora da lista. 'unsafe-inline' em script-src continua porque o Next.js e o
          // script de tema do layout usam scripts inline; trocar por nonce é uma melhoria futura.
          // Se algo legítimo for bloqueado, o Console (F12) mostra a origem para acrescentar aqui.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
              "frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com",
              "media-src 'self' blob: https://*.supabase.co",
              "manifest-src 'self'",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          // Desliga o acesso a APIs sensíveis do navegador que o app não usa.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
