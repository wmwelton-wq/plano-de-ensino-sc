/**
 * Localização aproximada (cidade, estado e país) a partir dos cabeçalhos que a hospedagem/Cloudflare
 * já acrescentam à requisição. Não guardamos o endereço IP: só o texto da cidade/estado/país.
 *
 *  - Atrás do Cloudflare: cf-ipcountry (sempre) e cf-ipcity / cf-region-code (se a opção
 *    "Adicionar cabeçalhos de localização do visitante" estiver ligada no Cloudflare).
 *  - Sem Cloudflare na frente: x-vercel-ip-country, x-vercel-ip-country-region e x-vercel-ip-city.
 */
export interface Localizacao {
  cidade: string | null;
  regiao: string | null;
  pais: string | null;
}

function limpar(v: string | null, max: number): string | null {
  if (!v) return null;
  let t = v;
  try {
    t = decodeURIComponent(v);
  } catch {
    /* mantém como veio */
  }
  t = t.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);
  return t && t !== "XX" && t !== "T1" ? t : null;
}

export function localizacaoDosCabecalhos(h: { get(nome: string): string | null }): Localizacao {
  const cf = h.get("cf-ipcountry");
  if (cf) {
    return { cidade: limpar(h.get("cf-ipcity"), 80), regiao: limpar(h.get("cf-region-code") ?? h.get("cf-region"), 40), pais: limpar(cf, 3) };
  }
  return {
    cidade: limpar(h.get("x-vercel-ip-city"), 80),
    regiao: limpar(h.get("x-vercel-ip-country-region"), 40),
    pais: limpar(h.get("x-vercel-ip-country"), 3),
  };
}
