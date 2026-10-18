/*
 * Service worker do Plano Docente — deliberadamente simples e seguro.
 * - Guarda só arquivos estáticos (scripts, estilos, fontes e imagens do próprio site) para o app abrir mais rápido.
 * - NUNCA guarda páginas do painel nem respostas de dados: planos e contas ficam só no servidor.
 * - Sem internet, ao abrir uma página nova, mostra a tela "/offline". A página que já estava aberta continua na tela.
 */
const VERSAO = "plano-docente-v1";
const ESTATICO = `${VERSAO}-estatico`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(ESTATICO)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c.startsWith("plano-docente-") && c !== ESTATICO).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

function ehEstatico(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || /\.(?:woff2?|png|jpe?g|svg|webp|ico)$/i.test(url.pathname);
}

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return; // Supabase e outros serviços passam direto

  if (pedido.mode === "navigate") {
    evento.respondWith(
      fetch(pedido).catch(() => caches.match(OFFLINE_URL).then((r) => r || new Response("Sem conexão.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } })))
    );
    return;
  }

  if (ehEstatico(url)) {
    evento.respondWith(
      caches.open(ESTATICO).then((cache) =>
        cache.match(pedido).then((guardado) => {
          const rede = fetch(pedido)
            .then((resposta) => {
              if (resposta.ok) cache.put(pedido, resposta.clone());
              return resposta;
            })
            .catch(() => guardado);
          return guardado || rede;
        })
      )
    );
  }
});
