// Cores fixas (inline) para o avatar continuar igual no modo escuro: as iniciais são sempre brancas.
const CORES = [
  ["#3b82f6", "#4f46e5"],
  ["#10b981", "#0d9488"],
  ["#8b5cf6", "#c026d3"],
  ["#f59e0b", "#ea580c"],
  ["#06b6d4", "#0284c7"],
  ["#f43f5e", "#db2777"],
] as const;

function iniciais(nome: string): string {
  const partes = nome
    .replace(/^(prof(essor|essora|a|\.)?\.?)\s+/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) return "?";
  const a = partes[0][0] ?? "";
  const b = partes.length > 1 ? (partes[partes.length - 1][0] ?? "") : "";
  return (a + b).toUpperCase();
}

function indiceCor(nome: string): number {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  return h % CORES.length;
}

/** Círculo colorido com as iniciais do colega (a cor é sempre a mesma para o mesmo nome). */
export default function AvatarColega({ nome, tamanho = "md" }: { nome: string; tamanho?: "sm" | "md" | "lg" }) {
  const t = tamanho === "lg" ? "h-12 w-12 text-base" : tamanho === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-extrabold shadow-sm ${t}`}
      style={{ background: `linear-gradient(135deg, ${CORES[indiceCor(nome)][0]}, ${CORES[indiceCor(nome)][1]})`, color: "#ffffff", boxShadow: "0 0 0 2px rgba(255,255,255,0.9)" }}
    >
      {iniciais(nome)}
    </span>
  );
}
