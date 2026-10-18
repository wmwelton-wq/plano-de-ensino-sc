import Link from "next/link";
import Logo from "@/components/logo";

export default function PaginaNaoEncontrada() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-12">
      <div className="card w-full max-w-md p-8 text-center">
        <Link href="/" aria-label="Plano Docente" className="inline-flex">
          <Logo />
        </Link>
        <p className="mt-6 text-sm font-bold uppercase tracking-wider text-primary-600">Erro 404</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">Página não encontrada</h1>
        <p className="mt-2 text-sm text-slate-600">O endereço pode ter mudado ou o plano foi excluído. Seus planos salvos continuam seguros.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/dashboard" className="btn-azul">
            Ir para o início
          </Link>
          <Link href="/dashboard/meus-planos" className="btn-azul-suave">
            Meus planos
          </Link>
        </div>
      </div>
    </main>
  );
}
