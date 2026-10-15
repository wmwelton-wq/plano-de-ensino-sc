import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

const itemMenu =
  "rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-primary-50 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";

/** Menu que abre ao passar o mouse (ou ao navegar com o teclado). Clicar no título leva à página principal da seção. */
function MenuSuspenso({ titulo, href, children }: { titulo: string; href: string; children: React.ReactNode }) {
  return (
    <div className="group relative">
      <Link href={href} className={`${itemMenu} inline-flex items-center gap-1`}>
        {titulo}
        <span aria-hidden="true" className="text-[10px] text-slate-400">
          ▼
        </span>
      </Link>
      <div className="invisible absolute left-0 top-full z-30 min-w-[15rem] pt-1 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="rounded-xl border border-primary-200 bg-white p-1.5 shadow-lg">{children}</div>
      </div>
    </div>
  );
}

function ItemMenu({ href, texto, destaque }: { href: string; texto: string; destaque?: boolean }) {
  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        destaque ? "text-primary-700" : "text-slate-700"
      }`}
    >
      {texto}
    </Link>
  );
}

function Divisor() {
  return <div className="my-1 border-t border-slate-200" role="separator" />;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: professor } = await supabase
    .from("professores")
    .select("nome")
    .eq("id", user.id)
    .single();

  const nomeExibido = professor?.nome ?? user.email ?? "";
  const inicial = nomeExibido.trim().charAt(0).toUpperCase() || "P";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-6 py-3.5">
          <div className="flex items-center gap-7">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 text-sm font-bold text-white shadow-sm">
                SC
              </span>
              <span className="hidden sm:inline">Planos de Ensino</span>
            </Link>
            <nav className="flex items-center gap-2" aria-label="Menu principal">
              <Link href="/dashboard" className={itemMenu}>
                Início
              </Link>
              <MenuSuspenso titulo="Planos" href="/dashboard/meus-planos">
                <ItemMenu href="/dashboard/meus-planos" texto="Todos os meus planos" />
                <ItemMenu href="/dashboard/meus-planos/anuais" texto="Planos anuais" />
                <ItemMenu href="/dashboard/meus-planos/mensais" texto="Planos mensais" />
                <Divisor />
                <ItemMenu href="/dashboard/anual/novo" texto="+ Cadastrar plano anual" destaque />
                <ItemMenu href="/dashboard/planos/novo" texto="+ Cadastrar plano mensal" destaque />
              </MenuSuspenso>
              <MenuSuspenso titulo="Escolas" href="/dashboard/escolas">
                <ItemMenu href="/dashboard/escolas" texto="Minhas escolas" />
                <Divisor />
                <ItemMenu href="/dashboard/escolas/nova" texto="+ Cadastrar escola" destaque />
              </MenuSuspenso>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-sm text-slate-600 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                {inicial}
              </span>
              {nomeExibido}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8 print:max-w-none print:p-0">{children}</main>
      <footer className="mx-auto max-w-5xl px-6 pb-8 text-center text-xs text-slate-400 print:hidden">
        <Link href="/termos-de-uso" className="link-primary text-xs">
          Termos de Uso
        </Link>
        <span className="mx-2" aria-hidden="true">
          ·
        </span>
        <Link href="/privacidade" className="link-primary text-xs">
          Aviso de Privacidade
        </Link>
      </footer>
    </div>
  );
}
