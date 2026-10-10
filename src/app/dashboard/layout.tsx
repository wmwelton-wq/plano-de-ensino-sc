import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
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
            <nav className="flex items-center gap-5">
              <Link
                href="/dashboard"
                className="rounded text-sm font-medium text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                Meus planos
              </Link>
              <Link
                href="/dashboard/escolas"
                className="rounded text-sm font-medium text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                Minhas escolas
              </Link>
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
