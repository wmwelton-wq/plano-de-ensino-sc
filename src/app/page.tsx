import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
        Planos de Ensino — Rede Estadual de SC
      </h1>
      <p className="mt-4 max-w-xl text-slate-600">
        Monte, organize e exporte os planos de ensino das suas disciplinas e
        cursos técnicos em um só lugar.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-primary-600 px-5 py-2.5 font-medium text-white hover:bg-primary-700"
        >
          Entrar
        </Link>
        <Link
          href="/cadastro"
          className="rounded-md border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-100"
        >
          Criar conta
        </Link>
      </div>
    </main>
  );
}
