import Link from "next/link";
import Logo from "@/components/logo";
import { Icone } from "@/components/icones";

export const metadata = {
  title: "Link indisponível | Plano Docente",
  robots: { index: false, follow: false },
};

export default function LinkIndisponivel() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 bg-gradient-to-b from-primary-50/60 via-transparent to-transparent px-5 py-10 text-center">
      <Logo />
      <section className="w-full space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Icone nome="alerta" className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-extrabold text-slate-900">Este link não está mais disponível</h1>
        <p className="text-sm text-slate-600">O link pode ter vencido ou o professor encerrou o compartilhamento. Peça um novo link a quem enviou.</p>
      </section>
      <Link href="/" className="text-sm font-semibold text-primary-700 hover:underline">
        Conhecer o Plano Docente
      </Link>
    </main>
  );
}
