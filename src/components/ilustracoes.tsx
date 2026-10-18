// Ilustrações do painel, desenhadas à mão em SVG (sem imagens externas, carregam na hora e ficam nítidas em qualquer tela).
// Funcionam em componentes de servidor e de cliente.

export type TomIlustracao = "azul" | "verde" | "violeta" | "ambar" | "ciano" | "ardosia" | "rosa";
export type NomeIlustracao = "meusPlanos" | "anual" | "mensal" | "escola" | "ajuda" | "opiniao" | "conta";

/** p = cor principal, d = escura, m = média, l = clara */
const PALETA: Record<TomIlustracao, { p: string; d: string; m: string; l: string }> = {
  azul: { p: "#3B82F6", d: "#1D4ED8", m: "#93C5FD", l: "#DBEAFE" },
  verde: { p: "#10B981", d: "#047857", m: "#6EE7B7", l: "#D1FAE5" },
  violeta: { p: "#8B5CF6", d: "#6D28D9", m: "#C4B5FD", l: "#EDE9FE" },
  ambar: { p: "#F59E0B", d: "#B45309", m: "#FCD34D", l: "#FEF3C7" },
  ciano: { p: "#06B6D4", d: "#0E7490", m: "#67E8F9", l: "#CFFAFE" },
  ardosia: { p: "#64748B", d: "#334155", m: "#CBD5E1", l: "#E2E8F0" },
  rosa: { p: "#EC4899", d: "#BE185D", m: "#F9A8D4", l: "#FCE7F3" },
};

/** Estrelinha de quatro pontas (brilho). */
function Brilho({ x, y, s = 6, cor = "#fff", o = 1 }: { x: number; y: number; s?: number; cor?: string; o?: number }) {
  const k = s * 0.26;
  return (
    <path
      d={`M${x} ${y - s}L${x + k} ${y - k}L${x + s} ${y}L${x + k} ${y + k}L${x} ${y + s}L${x - k} ${y + k}L${x - s} ${y}L${x - k} ${y - k}Z`}
      fill={cor}
      opacity={o}
    />
  );
}

/** Selo redondo com marca de confirmação (o mesmo da logo). */
function Selo({ cx, cy, r = 12, fundo = "#10B981", anel = "#fff" }: { cx: number; cy: number; r?: number; fundo?: string; anel?: string }) {
  const k = r / 12;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fundo} stroke={anel} strokeWidth={2.5 * k} />
      <path
        d={`M${cx - 5 * k} ${cy + 0.5 * k}l${3.8 * k} ${3.8 * k} ${6.6 * k} ${-7.6 * k}`}
        fill="none"
        stroke="#fff"
        strokeWidth={2.6 * k}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

const SOMBRA = "#0F172A";

/**
 * Cena de 160x100 usada nos cartões do painel. A cor segue o assunto (azul = anual, verde = mensal,
 * âmbar = escolas, ciano = ajuda, rosa = opinião, ardósia = meus planos).
 */
export function Ilustracao({
  nome,
  tom,
  mais = false,
  className = "h-full w-full",
}: {
  nome: NomeIlustracao;
  tom: TomIlustracao;
  /** Acrescenta um selo "+" (usado nos botões de cadastrar). */
  mais?: boolean;
  className?: string;
}) {
  const c = PALETA[tom];
  const cena = (() => {
    switch (nome) {
      case "anual":
        return (
          <>
            <circle cx="128" cy="30" r="27" fill={c.l} />
            <circle cx="26" cy="78" r="17" fill={c.l} opacity=".8" />
            <rect x="46" y="21" width="76" height="70" rx="10" fill={SOMBRA} opacity=".07" />
            <rect x="40" y="14" width="76" height="72" rx="10" fill="#fff" />
            <path d="M40 24a10 10 0 0 1 10-10h56a10 10 0 0 1 10 10v12H40z" fill={c.p} />
            <rect x="57" y="8" width="6" height="15" rx="3" fill={c.d} />
            <rect x="93" y="8" width="6" height="15" rx="3" fill={c.d} />
            <rect x="52" y="21" width="30" height="5" rx="2.5" fill="#fff" opacity=".85" />
            {[0, 1, 2].map((r) =>
              [0, 1, 2, 3].map((k) => {
                const dest = (r === 0 && k === 1) || (r === 1 && k === 3) || (r === 2 && k === 0);
                const atual = r === 1 && k === 1;
                return (
                  <rect
                    key={`${r}-${k}`}
                    x={48 + k * 17.5}
                    y={44 + r * 13.5}
                    width="13"
                    height="9"
                    rx="3"
                    fill={atual ? c.p : dest ? c.m : c.l}
                  />
                );
              }),
            )}
            <Selo cx={114} cy={80} r={12} fundo={tom === "verde" ? "#2563EB" : "#10B981"} />
            <Brilho x={142} y={62} s={5} cor={c.p} o={0.55} />
            <Brilho x={22} y={30} s={4} cor={c.m} />
          </>
        );
      case "conta":
        return (
          <>
            <circle cx="132" cy="28" r="24" fill={c.l} />
            <circle cx="26" cy="74" r="18" fill={c.l} opacity=".8" />
            <rect x="38" y="22" width="86" height="58" rx="12" fill={SOMBRA} opacity=".07" />
            <rect x="34" y="16" width="86" height="58" rx="12" fill="#fff" />
            <circle cx="60" cy="41" r="12" fill={c.p} />
            <circle cx="60" cy="38" r="4.5" fill="#fff" />
            <path d="M51 50a9 8 0 0 1 18 0z" fill="#fff" />
            <rect x="78" y="33" width="34" height="6" rx="3" fill={c.d} />
            <rect x="78" y="45" width="26" height="5" rx="2.5" fill={c.m} />
            <rect x="46" y="60" width="64" height="5" rx="2.5" fill={c.l} />
            <Selo cx={118} cy={70} r={12} fundo="#10B981" />
            <Brilho x={142} y={62} s={5} cor={c.p} o={0.55} />
          </>
        );
      case "mensal":
        return (
          <>
            <circle cx="30" cy="30" r="24" fill={c.l} />
            <circle cx="134" cy="76" r="19" fill={c.l} opacity=".8" />
            <g transform="rotate(-5 80 50)">
              <rect x="40" y="19" width="76" height="70" rx="10" fill={SOMBRA} opacity=".07" />
              <rect x="36" y="12" width="76" height="72" rx="10" fill="#fff" />
              <path d="M36 22a10 10 0 0 1 10-10h56a10 10 0 0 1 10 10v10H36z" fill={c.p} />
              <rect x="46" y="18" width="32" height="5" rx="2.5" fill="#fff" />
              <circle cx="102" cy="22" r="3" fill="#fff" opacity=".85" />
              {[0, 1, 2, 3].map((r) =>
                [0, 1, 2, 3, 4].map((k) => {
                  const feito = r * 5 + k < 7 && (k + r) % 2 === 0;
                  const hoje = r === 2 && k === 2;
                  return (
                    <circle
                      key={`${r}-${k}`}
                      cx={48 + k * 13.5}
                      cy={43 + r * 11}
                      r={hoje ? 4.6 : 3.4}
                      fill={hoje ? c.d : feito ? c.p : c.l}
                    />
                  );
                }),
              )}
            </g>
            {/* lápis */}
            <g transform="rotate(38 118 62)">
              <rect x="86" y="56" width="62" height="11" rx="3" fill="#FBBF24" />
              <rect x="86" y="56" width="62" height="4" rx="2" fill="#FDE68A" />
              <path d="M148 56l11 5.5L148 67z" fill="#FDE7C3" />
              <path d="M155 59.2l4 2.3-4 2.3z" fill="#334155" />
              <rect x="80" y="56" width="9" height="11" rx="3" fill="#F472B6" />
              <rect x="88" y="56" width="3" height="11" fill="#CBD5E1" />
            </g>
            {!mais && <Selo cx={118} cy={26} r={11} />}
            <Brilho x={20} y={74} s={5} cor={c.p} o={0.5} />
          </>
        );
      case "meusPlanos":
        return (
          <>
            <circle cx="132" cy="30" r="25" fill={c.l} />
            <circle cx="24" cy="76" r="15" fill={c.l} opacity=".8" />
            {/* pasta de trás */}
            <path d="M34 28a7 7 0 0 1 7-7h20l7 8h51a7 7 0 0 1 7 7v40a7 7 0 0 1-7 7H41a7 7 0 0 1-7-7z" fill={c.m} />
            {/* folhas */}
            <g transform="rotate(-6 70 40)">
              <rect x="46" y="22" width="52" height="46" rx="5" fill="#fff" />
              <rect x="53" y="31" width="30" height="4" rx="2" fill={c.l} />
              <rect x="53" y="40" width="38" height="4" rx="2" fill={c.l} />
              <rect x="53" y="49" width="22" height="4" rx="2" fill={c.l} />
            </g>
            <g transform="rotate(5 96 40)">
              <rect x="70" y="24" width="50" height="44" rx="5" fill="#fff" />
              <rect x="77" y="33" width="28" height="4" rx="2" fill={c.m} />
              <rect x="77" y="42" width="34" height="4" rx="2" fill={c.l} />
            </g>
            {/* pasta da frente */}
            <path d="M28 44a7 7 0 0 1 7-7h89a7 7 0 0 1 7 7v38a7 7 0 0 1-7 7H35a7 7 0 0 1-7-7z" fill={c.p} />
            <path d="M28 52h103v-8a7 7 0 0 0-7-7H35a7 7 0 0 0-7 7z" fill="#fff" opacity=".18" />
            <rect x="60" y="62" width="40" height="6" rx="3" fill="#fff" opacity=".55" />
            <Brilho x={142} y={70} s={5} cor={c.p} o={0.55} />
            <Brilho x={20} y={26} s={4} cor={c.m} />
          </>
        );
      case "escola":
        return (
          <>
            <circle cx="30" cy="32" r="22" fill={c.l} />
            <circle cx="132" cy="62" r="24" fill={c.l} opacity=".85" />
            {/* chão */}
            <ellipse cx="80" cy="90" rx="62" ry="5" fill={SOMBRA} opacity=".07" />
            {/* bandeira */}
            <rect x="79" y="6" width="2.4" height="20" rx="1" fill={c.d} />
            <path d="M81.4 7l15 4-15 4z" fill={c.p} />
            {/* telhado */}
            <path d="M80 18l44 24H36z" fill={c.d} />
            <path d="M80 18l44 24h-8L80 22z" fill="#fff" opacity=".18" />
            {/* corpo */}
            <rect x="42" y="42" width="76" height="46" rx="3" fill="#fff" />
            <rect x="42" y="42" width="76" height="6" fill={c.l} />
            <circle cx="80" cy="33" r="5.5" fill="#fff" />
            <path d="M80 29.5v4l2.6 1.6" fill="none" stroke={c.d} strokeWidth="1.6" strokeLinecap="round" />
            {/* janelas */}
            {[50, 66, 98 - 5, 108 - 6].map((x, i) => (
              <rect key={i} x={i < 2 ? x : x + 1} y="54" width="10" height="13" rx="2.5" fill={c.m} />
            ))}
            {/* porta */}
            <path d="M72 88V70a8 8 0 0 1 16 0v18z" fill={c.p} />
            <circle cx="85" cy="80" r="1.3" fill="#fff" />
            {/* degraus */}
            <rect x="68" y="87" width="24" height="4" rx="1.5" fill={c.d} opacity=".35" />
            {/* arbusto */}
            <circle cx="30" cy="82" r="8" fill="#34D399" />
            <circle cx="38" cy="85" r="6" fill="#10B981" />
            <circle cx="130" cy="84" r="7" fill="#34D399" />
            <Brilho x={142} y={22} s={5} cor={c.p} o={0.6} />
          </>
        );
      case "ajuda":
        return (
          <>
            <circle cx="46" cy="34" r="24" fill={c.l} />
            <circle cx="132" cy="68" r="22" fill={c.l} opacity=".85" />
            {/* raios */}
            {[
              [80, 6, 80, 13],
              [50, 16, 55, 22],
              [110, 16, 105, 22],
              [38, 40, 46, 41],
              [122, 40, 114, 41],
            ].map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
            ))}
            {/* lâmpada */}
            <path d="M80 16a25 25 0 0 0-14 45.6c2.4 1.7 3.4 3.7 3.4 6.4v2h21.2v-2c0-2.7 1-4.7 3.4-6.4A25 25 0 0 0 80 16z" fill="#FDE68A" />
            <path d="M80 16a25 25 0 0 0-14 45.6c.8.6 1.5 1.2 2 1.9A23 23 0 0 1 80 22a23 23 0 0 1 20.4 12.8A25 25 0 0 0 80 16z" fill="#fff" opacity=".6" />
            <path d="M72 42l8 10 8-10" fill="none" stroke="#F59E0B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M80 52v17" stroke="#F59E0B" strokeWidth="2.6" strokeLinecap="round" />
            <rect x="69" y="70" width="22" height="7" rx="3.5" fill={c.d} />
            <rect x="72" y="77" width="16" height="6" rx="3" fill={c.p} />
            {/* balão ? */}
            <circle cx="126" cy="26" r="13" fill={c.p} />
            <path d="M121 24.5a5 5 0 0 1 9.6 1.6c0 3.2-4.6 3.8-4.6 7" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="126" cy="38" r="0.1" fill="none" />
            <circle cx="126" cy="35.6" r="1.7" fill="#fff" />
            <Brilho x={30} y={72} s={5} cor={c.p} o={0.55} />
          </>
        );
      case "opiniao":
        return (
          <>
            <circle cx="132" cy="28" r="24" fill={c.l} />
            <circle cx="26" cy="74" r="18" fill={c.l} opacity=".85" />
            {/* balão grande */}
            <path d="M38 22a12 12 0 0 1 12-12h50a12 12 0 0 1 12 12v32a12 12 0 0 1-12 12H72l-14 12v-12h-8A12 12 0 0 1 38 54z" fill={c.p} />
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={i}
                d="M0 -7.5l2.2 4.8 5.2.6-3.9 3.5 1.1 5.2L0 4.1-4.6 6.6l1.1-5.2-3.9-3.5 5.2-.6z"
                transform={`translate(${52 + i * 13.5} 38)`}
                fill={i < 4 ? "#FDE68A" : "#fff"}
                opacity={i < 4 ? 1 : 0.5}
              />
            ))}
            {/* balão pequeno */}
            <path d="M92 52a9 9 0 0 1 9-9h30a9 9 0 0 1 9 9v18a9 9 0 0 1-9 9h-4v9l-10-9h-16a9 9 0 0 1-9-9z" fill="#fff" />
            <rect x="101" y="53" width="28" height="4" rx="2" fill={c.m} />
            <rect x="101" y="62" width="19" height="4" rx="2" fill={c.l} />
            <path d="M146 36c0-3-4-5-6-1.5C138 31 134 33 134 36c0 3.4 6 7 6 7s6-3.600 6-7z" fill="#F43F5E" transform="translate(-4 -10)" />
            <Brilho x={22} y={30} s={5} cor={c.p} o={0.55} />
          </>
        );
    }
  })();

  return (
    <svg viewBox="0 0 160 100" className={className} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
      {cena}
      {mais && (
        <g>
          <circle cx="132" cy="22" r="13" fill={c.d} stroke="#fff" strokeWidth="3" />
          <path d="M132 16.5v11M126.5 22h11" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

/**
 * Cena grande da faixa de boas-vindas (460x300): plano com itens marcados, calendário, livros com maçã,
 * vaso com planta, lápis e selo de confirmação. Os elementos soltos flutuam devagar.
 */
export function IlustracaoBoasVindas({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 460 300" className={className} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="bv-topo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id="bv-ceu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DBEAFE" />
          <stop offset="1" stopColor="#EFF6FF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* fundo suave */}
      <circle cx="238" cy="150" r="132" fill="url(#bv-ceu)" />
      <circle cx="238" cy="150" r="96" fill="#fff" opacity=".55" />
      <circle cx="96" cy="86" r="5" fill="#93C5FD" opacity=".7" />
      <circle cx="404" cy="132" r="7" fill="#6EE7B7" opacity=".8" />
      <circle cx="58" cy="168" r="4" fill="#FCD34D" />
      <circle cx="420" cy="60" r="4" fill="#C4B5FD" />

      {/* nuvens */}
      <g className="anim-flutua-lento" fill="#fff">
        <path d="M44 74a14 14 0 0 1 27-3 11 11 0 0 1 17 9 9 9 0 0 1-3 17H55a12 12 0 0 1-11-23z" opacity=".95" />
      </g>
      <g className="anim-flutua-lento" style={{ animationDelay: "-3s" }} fill="#fff">
        <path d="M356 40a12 12 0 0 1 23-3 10 10 0 0 1 15 8 8 8 0 0 1-3 15h-27a11 11 0 0 1-8-20z" opacity=".9" />
      </g>

      {/* chão */}
      <ellipse cx="236" cy="272" rx="200" ry="16" fill={SOMBRA} opacity=".07" />

      {/* calendário (atrás, à direita) */}
      <g transform="rotate(7 330 150)">
        <rect x="270" y="78" width="124" height="140" rx="16" fill={SOMBRA} opacity=".07" transform="translate(5 7)" />
        <rect x="270" y="78" width="124" height="140" rx="16" fill="#fff" />
        <path d="M270 94a16 16 0 0 1 16-16h92a16 16 0 0 1 16 16v28H270z" fill="#F59E0B" />
        <rect x="300" y="66" width="9" height="24" rx="4.5" fill="#B45309" />
        <rect x="355" y="66" width="9" height="24" rx="4.5" fill="#B45309" />
        <rect x="288" y="96" width="46" height="8" rx="4" fill="#fff" opacity=".85" />
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3, 4].map((k) => {
            const feito = [1, 3, 5, 8, 12].includes(r * 5 + k);
            const hoje = r * 5 + k === 11;
            return (
              <circle
                key={`${r}-${k}`}
                cx={288 + k * 20}
                cy={140 + r * 20}
                r={hoje ? 7.5 : 5.2}
                fill={hoje ? "#F59E0B" : feito ? "#FCD34D" : "#FEF3C7"}
              />
            );
          }),
        )}
      </g>

      {/* plano de ensino (centro) */}
      <g transform="rotate(-5 215 150)">
        <rect x="150" y="38" width="170" height="214" rx="18" fill={SOMBRA} opacity=".08" transform="translate(6 9)" />
        <rect x="150" y="38" width="170" height="214" rx="18" fill="#fff" />
        <path d="M150 56a18 18 0 0 1 18-18h134a18 18 0 0 1 18 18v34H150z" fill="url(#bv-topo)" />
        <rect x="170" y="56" width="74" height="9" rx="4.5" fill="#fff" />
        <rect x="170" y="72" width="104" height="7" rx="3.5" fill="#fff" opacity=".6" />
        <circle cx="292" cy="64" r="11" fill="#fff" opacity=".22" />
        <path d="M285.500 64.500l4.200 4.200 7.800-8.800" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(0 ${i * 38})`}>
            <rect x="170" y="108" width="22" height="22" rx="7" fill={i === 2 ? "#E2E8F0" : "#10B981"} />
            {i < 2 && <path d="M176 119.500l4.200 4.200 7-8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
            <rect x="202" y="109" width={i === 1 ? 84 : 98} height="8" rx="4" fill="#CBD5E1" />
            <rect x="202" y="123" width={i === 1 ? 58 : 66} height="7" rx="3.500" fill="#E2E8F0" />
          </g>
        ))}
        <rect x="170" y="226" width="38" height="14" rx="7" fill="#DBEAFE" />
        <rect x="214" y="226" width="38" height="14" rx="7" fill="#D1FAE5" />
        <rect x="258" y="226" width="38" height="14" rx="7" fill="#FEF3C7" />
      </g>

      {/* livros + maçã (esquerda) */}
      <g>
        <rect x="42" y="236" width="138" height="30" rx="6" fill="#4F46E5" />
        <rect x="42" y="236" width="138" height="9" rx="4.5" fill="#fff" opacity=".16" />
        <rect x="168" y="240" width="10" height="22" rx="2" fill="#E0E7FF" />
        <rect x="66" y="236" width="6" height="30" fill="#FCD34D" />
        <rect x="52" y="208" width="116" height="28" rx="6" fill="#10B981" />
        <rect x="52" y="208" width="116" height="8" rx="4" fill="#fff" opacity=".18" />
        <rect x="156" y="212" width="10" height="20" rx="2" fill="#D1FAE5" />
        <rect x="78" y="208" width="6" height="28" fill="#fff" opacity=".6" />
        <rect x="62" y="182" width="96" height="26" rx="6" fill="#F59E0B" />
        <rect x="62" y="182" width="96" height="8" rx="4" fill="#fff" opacity=".22" />
        <rect x="146" y="186" width="10" height="18" rx="2" fill="#FEF3C7" />
        {/* maçã */}
        <circle cx="96" cy="170" r="13" fill="#EF4444" />
        <path d="M96 157.500c-1-5 1-8 4-9" fill="none" stroke="#7C2D12" strokeWidth="2.600" strokeLinecap="round" />
        <path d="M99 154c3-5 9-5 11-3-2 4-7 6-11 3z" fill="#34D399" />
        <path d="M88 166a8 8 0 0 1 5-6" fill="none" stroke="#fff" strokeWidth="2.400" strokeLinecap="round" opacity=".55" />
      </g>

      {/* vaso com planta (direita) */}
      <g>
        <path d="M358 214c-14-26-30-34-38-38 8-4 28-4 38 38z" fill="#34D399" />
        <path d="M362 210c-2-34 6-56 24-72 6 30-2 56-24 72z" fill="#10B981" />
        <path d="M366 214c10-20 28-30 46-30-4 20-22 34-46 30z" fill="#059669" />
        <path d="M358 214c-22-4-34-18-34-34 20 2 34 14 34 34z" fill="#6EE7B7" />
        <path d="M334 214h68l-9 52a8 8 0 0 1-8 7h-34a8 8 0 0 1-8-7z" fill="#F97316" />
        <path d="M330 212a6 6 0 0 1 6-6h64a6 6 0 0 1 6 6v6a2 2 0 0 1-2 2h-72a2 2 0 0 1-2-2z" fill="#FB923C" />
        <path d="M341 232l4 33" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".25" />
      </g>

      {/* lápis na frente */}
      <g transform="rotate(-24 240 252)">
        <rect x="170" y="246" width="132" height="14" rx="4" fill="#FBBF24" />
        <rect x="170" y="246" width="132" height="5" rx="2.500" fill="#FDE68A" />
        <path d="M302 246l20 7-20 7z" fill="#FDE7C3" />
        <path d="M314 250.200l8 2.800-8 2.800z" fill="#334155" />
        <rect x="160" y="246" width="12" height="14" rx="4" fill="#F472B6" />
        <rect x="171" y="246" width="4" height="14" fill="#CBD5E1" />
      </g>

      {/* selo flutuante */}
      <g className="anim-flutua">
        <Selo cx={150} cy={46} r={22} />
      </g>

      {/* brilhos */}
      <g className="anim-pisca">
        <Brilho x={122} y={116} s={9} cor="#F59E0B" />
      </g>
      <g className="anim-pisca" style={{ animationDelay: "-1.2s" }}>
        <Brilho x={402} y={102} s={8} cor="#3B82F6" o={0.8} />
      </g>
      <g className="anim-pisca" style={{ animationDelay: "-2.2s" }}>
        <Brilho x={376} y={222} s={6} cor="#EC4899" o={0.7} />
      </g>
      <Brilho x={30} y={214} s={6} cor="#10B981" o={0.7} />
    </svg>
  );
}

/** Anel de progresso (0–100). */
export function AnelProgresso({
  percentual,
  tamanho = 132,
  espessura = 14,
  children,
}: {
  percentual: number;
  tamanho?: number;
  espessura?: number;
  children?: React.ReactNode;
}) {
  const r = (tamanho - espessura) / 2;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percentual));
  return (
    <div className="relative" style={{ width: tamanho, height: tamanho }}>
      <svg viewBox={`0 0 ${tamanho} ${tamanho}`} width={tamanho} height={tamanho} aria-hidden="true" className="-rotate-90">
        <defs>
          <linearGradient id="anel-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#10B981" />
            <stop offset="1" stopColor="#34D399" />
          </linearGradient>
        </defs>
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={espessura} />
        {p > 0 && (
          <circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={r}
            fill="none"
            stroke="url(#anel-grad)"
            strokeWidth={espessura}
            strokeLinecap="round"
            strokeDasharray={`${(circ * p) / 100} ${circ}`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
