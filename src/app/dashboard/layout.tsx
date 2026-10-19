import InstalarApp from "@/components/instalar-app";
import AlternarTema from "@/components/alternar-tema";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/logo";
import LogoutButton from "./logout-button";
import MenuTopo, { type MenuDoTopo } from "./menu-topo";
import { UsuarioProvider } from "./usuario-contexto";
import "./painel.css";

export const metadata: Metadata = {
  title: "Plano Docente — Meu painel",
};

/** "WELTON MATOS" ou "welton" viram "Welton"; e-mails viram a parte antes do @. */
function primeiroNomeDe(texto: string): string {
  const base = texto.includes("@") ? texto.split("@")[0].split(/[._-]/)[0] : texto.trim().split(/\s+/)[0] ?? "";
  if (!base) return "";
  return base.charAt(0).toLocaleUpperCase("pt-BR") + base.slice(1).toLocaleLowerCase("pt-BR");
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
      ativoEm: ["/dashboard/meus-planos", "/dashboard/anual", "/dashboard/planos"],
      itens: [
        { href: "/dashboard/meus-planos", texto: "Todos os meus planos", icone: "pasta", descricao: "Organizados por escola e turma" },
        { href: "/dashboard/meus-planos/anuais", texto: "Planos anuais", icone: "calendario", descricao: "Habilidades de cada trimestre" },
        { href: "/dashboard/meus-planos/mensais", texto: "Planos mensais", icone: "livro", descricao: "O que vai para a sala de aula" },
        { href: "/dashboard/anual/novo", texto: "Cadastrar plano anual", icone: "mais", destaque: true, divisor: true },
        { href: "/dashboard/planos/novo", texto: "Cadastrar plano mensal", icone: "mais", destaque: true },
      ],
    },
    {
      titulo: "Escolas",
      href: "/dashboard/escolas",
      ativoEm: ["/dashboard/escolas"],
      itens: [
        { href: "/dashboard/escolas", texto: "Minhas escolas", icone: "escola", descricao: "Veja e edite as escolas" },
        { href: "/dashboard/escolas/nova", texto: "Cadastrar escola", icone: "mais", destaque: true, divisor: true },
      ],
    },
  ];
  const extras = [{ href: "/dashboard/calendario", texto: "Calendário" }, { href: "/dashboard/colegas", texto: "Colegas" }, { href: "/dashboard/ajuda", texto: "Ajuda" }, ...(ehAdmin === true ? [{ href: "/dashboard/admin", texto: "Central do admin" }] : [])];

  const nomeExibido = professor?.nome ?? user.email ?? "";
  const inicial = nomeExibido.trim().charAt(0).toUpperCase() || "P";
  const primeiroNome = primeiroNomeDe(professor?.nome ?? user.email ?? "");

  return (
    <UsuarioProvider primeiroNome={primeiroNome}>
      <div className="min-h-screen bg-[var(--background)]">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-md print:hidden">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:px-6 sm:py-2.5">
            <Link
              href="/dashboard"
              aria-label="Plano Docente — ir para o início"
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <Logo />
            </Link>
            <span className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden="true" />
            <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
              <MenuTopo menus={menus} extras={extras} />
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <Link
                href="/dashboard/conta"
                aria-label={`Configurações da conta de ${nomeExibido}`}
                title="Configurações da conta"
                className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-1 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                  {inicial}
                </span>
              </Link>
              <AlternarTema />
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
          <InstalarApp />
        </footer>
      </div>
    </UsuarioProvider>
  );
}
