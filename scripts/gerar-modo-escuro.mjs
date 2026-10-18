/**
 * Gera src/app/modo-escuro.css a partir do CSS já compilado do site.
 *
 * Como usar (só quem mantém o projeto): compile o CSS do Tailwind do projeto, junte com dashboard/painel.css e rode
 *   node scripts/gerar-modo-escuro.mjs <css-compilado> <saida>
 * Para cada regra que define cor, cria a versão escura (cores com a luminosidade invertida), valendo apenas em
 * html.dark, em telas (nunca na impressão) e nunca dentro de #plano-conteudo (a folha do plano é sempre branca).
 */
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(process.env.POSTCSS_DIR ? process.env.POSTCSS_DIR + "/" : import.meta.url);
const postcss = require("postcss");

const [, , entrada, saida] = process.argv;
const css = fs.readFileSync(entrada, "utf8");

// Luminosidade original -> luminosidade no escuro (interpolação entre os pontos).
const PONTOS = [
  [0, 0.99], [0.05, 0.97], [0.1, 0.95], [0.17, 0.92], [0.25, 0.87], [0.35, 0.8], [0.47, 0.72], [0.65, 0.6],
  [0.84, 0.28], [0.91, 0.21], [0.96, 0.165], [0.98, 0.09], [1, 0.13],
];
function mapaL(l) {
  for (let i = 1; i < PONTOS.length; i++) {
    if (l <= PONTOS[i][0]) {
      const [x0, y0] = PONTOS[i - 1];
      const [x1, y1] = PONTOS[i];
      return y0 + ((l - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return PONTOS[PONTOS.length - 1][1];
}
function rgbParaHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}
function hslParaRgb(h, s, l) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
}
function escurecer(r, g, b) {
  const [h, s, l] = rgbParaHsl(r, g, b);
  const l2 = mapaL(l);
  let s2 = l2 < 0.35 ? s * 0.62 : s * 0.92;
  let h2 = h;
  // Cinzas puros ganham o leve tom azulado do restante do tema escuro.
  if (s < 0.05 && l2 < 0.3) { h2 = 0.6; s2 = 0.28; }
  return hslParaRgb(h2, s2, l2);
}
const hex = (n) => n.toString(16).padStart(2, "0");

function converterValor(valor) {
  let mudou = false;
  let saidaV = valor.replace(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (m, h) => {
    let c = h;
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
    const [R, G, B] = escurecer(r, g, b);
    mudou = true;
    return `#${hex(R)}${hex(G)}${hex(B)}${c.length === 8 ? c.slice(6) : ""}`;
  });
  saidaV = saidaV.replace(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[,/]\s*([^)]+))?\)/g, (m, r, g, b, a) => {
    const [R, G, B] = escurecer(+r, +g, +b);
    mudou = true;
    return a ? `rgb(${R} ${G} ${B} / ${a.trim()})` : `rgb(${R} ${G} ${B})`;
  });
  // Palavras: white / black / transparent
  saidaV = saidaV.replace(/(^|[\s(,])(white)(?=$|[\s),])/gi, (m, pre) => {
    mudou = true;
    const [R, G, B] = escurecer(255, 255, 255);
    return `${pre}rgb(${R} ${G} ${B})`;
  });
  return mudou ? saidaV : null;
}

const PROPRIEDADES = /^(background(-color|-image)?|color|border(-top|-right|-bottom|-left)?(-color)?|outline(-color)?|fill|stroke|text-decoration-color|caret-color|accent-color|--tw-(ring-color|ring-offset-color|gradient-from|gradient-to|gradient-via|gradient-stops|shadow-color)|--tom[a-z-]*|--[a-z-]*(cor|color|fundo|borda)[a-z-]*)$/;

const resultado = [];
const raiz = postcss.parse(css);

const FORA_DO_PLANO = ":not(#plano-conteudo):not(#plano-conteudo *)";

function prefixar(seletor) {
  const partes = seletor
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    // Regras universais do Tailwind ("*, ::before, ::after", ::backdrop) são tratadas à mão abaixo.
    .filter((s) => !/^(\*|::before|::after|::backdrop|html|body)/.test(s));
  return partes
    .map((s) => {
      if (s === ":root") return "html.dark";
      const i = s.search(/::/);
      const base = i === -1 ? s : s.slice(0, i);
      const pseudo = i === -1 ? "" : s.slice(i);
      return `html.dark ${base}${FORA_DO_PLANO}${pseudo}`;
    })
    .join(",\n");
}

function processarRegra(regra) {
  if (regra.parent?.type === "atrule" && /keyframes|font-face|property/.test(regra.parent.name)) return null;
  const decls = [];
  regra.walkDecls((d) => {
    if (!PROPRIEDADES.test(d.prop)) return;
    if (/^--tw-(ring|shadow)\b/.test(d.prop) && !/color/.test(d.prop)) return;
    if (/var\(--tw-bg-opacity\)|var\(--tw-text-opacity\)|var\(--tw-border-opacity\)/.test(d.value) || true) {
      const novo = converterValor(d.value);
      if (novo !== null) decls.push(`${d.prop}: ${novo}`);
    }
  });
  if (decls.length === 0) return null;
  const seletor = prefixar(regra.selector);
  if (!seletor) return null;
  return `${seletor} {\n  ${decls.join(";\n  ")};\n}`;
}

const blocos = [];
raiz.each((no) => {
  if (no.type === "rule") {
    const r = processarRegra(no);
    if (r) blocos.push(r);
  } else if (no.type === "atrule" && /^(media|supports|layer)$/.test(no.name)) {
    const internos = [];
    no.walkRules((r) => {
      const t = processarRegra(r);
      if (t) internos.push(t.replace(/^/gm, "  "));
    });
    if (internos.length) blocos.push(no.name === "layer" ? internos.map((i) => i.replace(/^  /gm, "")).join("\n") : `@${no.name} ${no.params} {\n${internos.join("\n")}\n}`);
  }
});

const cabecalho = `/* GERADO por scripts/gerar-modo-escuro.mjs — não edite à mão. Modo escuro do painel (só em telas; a folha do plano fica branca). */\n`;
const base = `
html.dark { color-scheme: dark; --background: #0b1220; --foreground: #e6ebf5; }
html.dark ::placeholder { color: #7b8aa3; }
html.dark body { background-color: #0b1220; }
html.dark *:not(#plano-conteudo):not(#plano-conteudo *) { border-color: #26324a; }
html.dark ::-webkit-scrollbar-thumb { background-color: #334155; }
html.dark #plano-conteudo { background-color: #fff; border-radius: 0.7rem; color-scheme: light; }
`;
fs.writeFileSync(saida, `${cabecalho}@media screen {\n${base}\n${blocos.join("\n")}\n}\n`);
console.log("regras escuras:", blocos.length);
