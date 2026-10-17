// Ícones de traço simples (24x24), usados em todo o sistema no lugar de emojis.
// Funciona em componentes de servidor e de cliente (não usa estado).

const CIRCULO = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const CAMINHOS = {
  escola: ["M3 21h18", "M5 21V10l7-5 7 5v11", "M9 21v-6h6v6", "M12 10h.01"],
  livro: ["M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z", "M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"],
  calendario: ["M8 2v4", "M16 2v4", "M3 10h18", "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"],
  calendarioMes: ["M8 2v4", "M16 2v4", "M3 10h18", "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "M8 14h.01", "M12 14h.01", "M16 14h.01", "M8 18h.01", "M12 18h.01"],
  check: ["M20 6 9 17l-5-5"],
  listaCheck: ["M3 6l1.5 1.5L7 5", "M3 12l1.5 1.5L7 11", "M3 18l1.5 1.5L7 17", "M11 6h10", "M11 12h10", "M11 18h10"],
  alvo: [CIRCULO(12, 12, 10), CIRCULO(12, 12, 6), CIRCULO(12, 12, 2)],
  usuarios: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", CIRCULO(9, 7, 4), "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  lampada: ["M9 18h6", "M10 22h4", "M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"],
  balao: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"],
  mais: ["M12 5v14", "M5 12h14"],
  lupa: [CIRCULO(11, 11, 8), "M21 21l-4.3-4.3"],
  estrela: ["M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"],
  pasta: ["M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
  documento: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8", "M8 17h8", "M8 9h2"],
  lapis: ["M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"],
  baixar: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  setaDireita: ["M5 12h14", "M12 5l7 7-7 7"],
  setaEsquerda: ["M19 12H5", "M12 19l-7-7 7-7"],
  alerta: ["M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z", "M12 9v4", "M12 17h.01"],
  graduacao: ["M22 10 12 5 2 10l10 5z", "M6 12v5c3 3 9 3 12 0v-5", "M22 10v6"],
  ajuda: [CIRCULO(12, 12, 10), "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3", "M12 17h.01"],
  sair: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  cadeado: ["M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z", "M7 11V7a5 5 0 0 1 10 0v4"],
  frasco: ["M10 2v7.3L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9.3V2", "M8.5 2h7", "M7 16h10"],
  camadas: ["M12 2 2 7l10 5 10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"],
  bussola: [CIRCULO(12, 12, 10), "M16.2 7.8l-2 6.3-6.4 2.1 2-6.3z"],
  criterios: ["M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2", "M9 2h6v4H9z", "M9 14l2 2 4-4"],
  unidade: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M14 14h7v7h-7z", "M3 14h7v7H3z"],
  globo: [CIRCULO(12, 12, 10), "M2 12h20", "M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10A15 15 0 0 1 12 2z"],
  copiar: ["M9 9h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z", "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"],
  olho: ["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z", CIRCULO(12, 12, 3)],
  pessoa: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", CIRCULO(12, 7, 4)],
  sparkle: ["M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"],
  fechar: ["M18 6 6 18", "M6 6l12 12"],
  caixa: ["M3 3h18v18H3z", "M3 9h18", "M9 21V9"],
  imprimir: ["M6 9V2h12v7", "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2", "M6 14h12v8H6z"],
  coracao: ["M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"],
  envelope: ["M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "M22 7l-10 6L2 7"],
  tag: ["M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z", "M7 7h.01"],
} as const;

export type NomeIcone = keyof typeof CAMINHOS;

export function Icone({ nome, className = "h-5 w-5", espessura = 1.8 }: { nome: NomeIcone; className?: string; espessura?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={espessura}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {CAMINHOS[nome].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
