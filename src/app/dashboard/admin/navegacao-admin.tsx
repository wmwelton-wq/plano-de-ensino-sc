import Link from "next/link";

const ABAS = [
  { href: "/dashboard/admin", rotulo: "Visão geral", chave: "geral" },
  { href: "/dashboard/admin/ia", rotulo: "IAs e custos", chave: "ia" },
  { href: "/dashboard/admin/banco", rotulo: "Banco e segurança", chave: "banco" },
] as const;

/** Abas da central do administrador. */
export default function NavegacaoAdmin({ atual }: { atual: (typeof ABAS)[number]["chave"] }) {
  return (
    <nav aria-label="Central do administrador" className="mt-4 flex flex-wrap gap-2">
      {ABAS.map((a) => (
        <Link
          key={a.chave}
          href={a.href}
          aria-current={a.chave === atual ? "page" : undefined}
          className={
            a.chave === atual
              ? "rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
              : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          }
        >
          {a.rotulo}
        </Link>
      ))}
    </nav>
  );
}
