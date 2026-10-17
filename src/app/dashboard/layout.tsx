import { Icone } from "@/components/icones";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";
import MenuTopo, { type MenuDoTopo } from "./menu-topo";

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

  // As duas consultas do cabeçalho rodam juntas (uma só espera de rede, não duas em fila).
  // eh_admin devolve false para os demais professores (ou se a função não existir).
  const [{ data: professor }, { data: ehAdmin }] = await Promise.all([
    supabase.from("professores").select("nome").eq("id", user.id).single(),
    supabase.rpc("eh_admin"),
  ]);

  const menus: MenuDoTopo[] = [
    {
      titulo: "Planos",
      href: "/dashboard/meus-planos",
      itens: [
        { href: "/dashboard/meus-planos", texto: "Todos os meus planos" },
        { href: "/dashboard/meus-planos/anuais", texto: "Planos anuais" },
        { href: "/dashboard/meus-planos/mensais", texto: "Planos mensais" },
        { href: "/dashboard/anual/novo", texto: "+ Cadastrar plano anual", destaque: true, divisor: true },
        { href: "/dashboard/planos/novo", texto: "+ Cadastrar plano mensal", destaque: true },
      ],
    },
    {
      titulo: "Escolas",
      href: "/dashboard/escolas",
      itens: [
        { href: "/dashboard/escolas", texto: "Minhas escolas" },
        { href: "/dashboard/escolas/nova", texto: "+ Cadastrar escola", destaque: true, divisor: true },
      ],
    },
  ];
  const extras = [{ href: "/dashboard/ajuda", texto: "Ajuda" }, ...(ehAdmin === true ? [{ href: "/dashboard/admin", texto: "Painel de uso" }] : [])];

  const nomeExibido = professor?.nome ?? user.email ?? "";
  const inicial = nomeExibido.trim().charAt(0).toUpperCase() || "P";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-10 border-b border-slate-300 bg-white print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-4 py-2.5 sm:px-6 sm:py-3.5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-800 text-white">
                <Icone nome="livro" className="h-5 w-5" />
              </span>
              <span className="hidden sm:inline">Planos de Ensino</span>
            </Link>
            <MenuTopo menus={menus} extras={extras} />
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
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 print:max-w-none print:p-0">{children}</main>
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
