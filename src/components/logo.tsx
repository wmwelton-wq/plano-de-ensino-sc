// Logo do Plano Docente: folha de plano com selo de confirmação.
// Usada no cabeçalho do painel. O ícone da aba do navegador está em src/app/icon.svg.

export function LogoMarca({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true" focusable="false">
      <rect width="512" height="512" rx="116" fill="#2563EB" />
      <path d="M150 108h142l82 82v182a28 28 0 0 1-28 28H150a28 28 0 0 1-28-28V136a28 28 0 0 1 28-28z" fill="#fff" />
      <path d="M292 108v54a28 28 0 0 0 28 28h54z" fill="#BFDBFE" />
      <rect x="168" y="232" width="124" height="24" rx="12" fill="#BFDBFE" />
      <rect x="168" y="278" width="100" height="24" rx="12" fill="#BFDBFE" />
      <circle cx="360" cy="360" r="86" fill="#10B981" stroke="#2563EB" strokeWidth="22" />
      <path d="M322 362l30 30 52-62" fill="none" stroke="#fff" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Logo completo: marca + nome. `mostrarNome` esconde o nome (ex.: telas bem pequenas). */
export default function Logo({ className = "", mostrarNome = true }: { className?: string; mostrarNome?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMarca className="h-9 w-9 shrink-0 drop-shadow-sm" />
      {mostrarNome && (
        <span className="text-[1.05rem] font-extrabold leading-none tracking-tight text-slate-900">
          Plano <span className="text-primary-600">Docente</span>
        </span>
      )}
    </span>
  );
}
