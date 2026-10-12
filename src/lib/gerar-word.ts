// Geração de documento Word (.doc) no navegador, sem dependências novas.
//
// O arquivo é um MHTML ("página da web de arquivo único"): HTML + imagens
// embutidas num único arquivo multipart/related. O Word abre esse formato
// como um documento normal, editável (tabelas, negrito, listas e as
// imagens do cabeçalho). Para o resultado ficar fiel à tela, cada elemento
// do clone recebe como estilo "inline" os estilos já calculados pelo
// navegador no elemento original — assim não dependemos das classes do
// Tailwind, que o Word não conhece. Página A4 (retrato ou paisagem, conforme a
// etapa), com 2 cm de margem à esquerda e à direita e 1,5 cm em cima e embaixo.

function nomeArquivo(titulo: string): string {
  const base = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${base || "plano-de-ensino"}.doc`;
}

const PROPRIEDADES = [
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "text-align",
  "text-decoration-line",
  "text-transform",
  "line-height",
  "text-indent",
  "vertical-align",
  "color",
  "background-color",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin-top",
  "margin-bottom",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "list-style-type",
] as const;

/** Converte "rgba(0, 0, 0, 0)" etc. — descarta fundos transparentes. */
function corVisivel(valor: string): boolean {
  if (!valor || valor === "transparent") return false;
  const m = /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)/.exec(valor);
  return !m;
}

function copiarEstilos(original: Element, clone: Element) {
  if (!(original instanceof HTMLElement) || !(clone instanceof HTMLElement)) return;
  const cs = window.getComputedStyle(original);
  const partes: string[] = [];

  for (const prop of PROPRIEDADES) {
    let valor = cs.getPropertyValue(prop);
    if (!valor) continue;
    if (prop === "background-color" && !corVisivel(valor)) continue;
    if (prop.startsWith("border-")) {
      const largura = cs.getPropertyValue(`${prop}-width`);
      const estilo = cs.getPropertyValue(`${prop}-style`);
      const cor = cs.getPropertyValue(`${prop}-color`);
      if (!estilo || estilo === "none" || largura === "0px") continue;
      valor = `${largura} ${estilo} ${cor}`;
    }
    if (prop === "line-height" && valor === "normal") continue;
    partes.push(`${prop}:${valor}`);
  }

  const tag = original.tagName;
  if (tag === "TABLE") {
    partes.push("border-collapse:collapse", "width:100%");
  } else if (tag === "TD" || tag === "TH") {
    const tabela = original.closest("table");
    if (tabela && tabela.offsetWidth > 0) {
      const pct = Math.round((original.offsetWidth / tabela.offsetWidth) * 1000) / 10;
      partes.push(`width:${pct}%`);
    }
  } else if (tag === "TR") {
    // Linhas curtas não se dividem entre páginas; as longas podem, para não deixar espaço vazio.
    if (original.offsetHeight > 0 && original.offsetHeight <= 140) partes.push("page-break-inside:avoid");
  } else if (tag === "UL" || tag === "OL") {
    partes.push(`padding-left:${cs.getPropertyValue("padding-left") || "0px"}`);
  }

  clone.setAttribute("style", partes.join(";"));
  clone.removeAttribute("class");
}

function percorrerPares(original: Element, clone: Element) {
  copiarEstilos(original, clone);
  const o = Array.from(original.children);
  const c = Array.from(clone.children);
  for (let i = 0; i < Math.min(o.length, c.length); i++) {
    percorrerPares(o[i], c[i]);
  }
}

/** Carrega uma imagem e devolve seu conteúdo como PNG em base64 (ou null se falhar). */
async function imagemParaPng(src: string): Promise<{ base64: string; w: number; h: number } | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("imagem"));
      img.src = src;
    });
    const maxLargura = 600;
    const escala = img.naturalWidth > maxLargura ? maxLargura / img.naturalWidth : 1;
    const w = Math.max(1, Math.round((img.naturalWidth || img.width) * escala));
    const h = Math.max(1, Math.round((img.naturalHeight || img.height) * escala));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    const url = canvas.toDataURL("image/png");
    return { base64: url.split(",")[1] ?? "", w, h };
  } catch {
    return null;
  }
}

function quebrarEmLinhas(base64: string): string {
  return base64.replace(/(.{76})/g, "$1\r\n");
}

function utf8ParaBase64(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let bin = "";
  const bloco = 0x8000;
  for (let i = 0; i < bytes.length; i += bloco) {
    bin += String.fromCharCode(...bytes.subarray(i, i + bloco));
  }
  return btoa(bin);
}

/**
 * Monta o arquivo .doc (MHTML) a partir do elemento com o id informado
 * e o devolve como File, pronto para download.
 */
export async function gerarWordDoElemento(
  elementId: string,
  titulo: string,
  orientacao: "retrato" | "paisagem" = "retrato"
): Promise<File> {
  const elemento = document.getElementById(elementId);
  if (!elemento) {
    throw new Error("Conteúdo do plano não encontrado para gerar o Word.");
  }

  const clone = elemento.cloneNode(true) as HTMLElement;
  percorrerPares(elemento, clone);

  // Imagens (brasões do cabeçalho): embutidas como partes do MHTML.
  const imagensOriginais = Array.from(elemento.querySelectorAll("img"));
  const imagensClone = Array.from(clone.querySelectorAll("img"));
  const partesImagem: { local: string; base64: string }[] = [];

  for (let i = 0; i < imagensClone.length; i++) {
    const original = imagensOriginais[i];
    const alvo = imagensClone[i];
    const src = original?.currentSrc || original?.src;
    const png = src ? await imagemParaPng(src) : null;
    if (!png || !png.base64) {
      alvo.remove();
      continue;
    }
    const local = `file:///C:/plano_arquivos/imagem${i + 1}.png`;
    const larguraTela = original.offsetWidth || png.w;
    const alturaTela = original.offsetHeight || png.h;
    alvo.setAttribute("src", local);
    alvo.setAttribute("width", String(Math.round(larguraTela)));
    alvo.setAttribute("height", String(Math.round(alturaTela)));
    alvo.removeAttribute("srcset");
    alvo.removeAttribute("loading");
    partesImagem.push({ local, base64: png.base64 });
  }

  const tamanhoPagina = orientacao === "paisagem" ? "841.9pt 595.3pt" : "595.3pt 841.9pt";
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>${titulo.replace(/[<>&]/g, "")}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
@page WordSection1 { size: ${tamanhoPagina}; mso-page-orientation: ${orientacao === "paisagem" ? "landscape" : "portrait"}; margin: 42.5pt 56.7pt 42.5pt 56.7pt; mso-header-margin: 21.3pt; mso-footer-margin: 21.3pt; }
div.WordSection1 { page: WordSection1; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000000; }
table { border-collapse: collapse; }
p { margin-top: 0; margin-bottom: 4pt; }
</style>
</head>
<body>
<div class="WordSection1">
${clone.innerHTML}
</div>
</body>
</html>`;

  const limite = "----=_NextPart_planodocente_" + Math.random().toString(36).slice(2);
  const corpo: string[] = [];
  corpo.push(
    "MIME-Version: 1.0",
    `Content-Type: multipart/related; boundary="${limite}"; type="text/html"`,
    "",
    `--${limite}`,
    'Content-Type: text/html; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
    "Content-Location: file:///C:/plano.htm",
    "",
    quebrarEmLinhas(utf8ParaBase64(html)),
    ""
  );
  for (const parte of partesImagem) {
    corpo.push(
      `--${limite}`,
      "Content-Type: image/png",
      "Content-Transfer-Encoding: base64",
      `Content-Location: ${parte.local}`,
      "",
      quebrarEmLinhas(parte.base64),
      ""
    );
  }
  corpo.push(`--${limite}--`, "");

  const blob = new Blob([corpo.join("\r\n")], { type: "application/msword" });
  return new File([blob], nomeArquivo(titulo), { type: "application/msword" });
}
