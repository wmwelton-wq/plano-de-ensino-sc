/** @type {import('next').NextConfig} */
const nextConfig = {
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
