export default function CarregandoDashboard() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-4">
      <span className="sr-only">Carregando…</span>
      <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}
