import type { Metadata } from "next";
import Logo from "@/components/logo";

export const metadata: Metadata = { title: "Sem conexão | Plano Docente", robots: { index: false } };

/** Tela mostrada pelo app instalado quando não há internet ao abrir uma página nova. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo />
      <h1 className="text-2xl font-extrabold text-slate-900">Você está sem internet</h1>
      <p className="text-slate-600">
        Seus planos ficam guardados com segurança no servidor e voltam assim que a conexão voltar. Se você já estava escrevendo um plano, a tela aberta continua funcionando — é só clicar em <strong>Salvar</strong> quando a internet voltar.
      </p>
      <a href="/dashboard" className="btn-azul">
        Tentar de novo
      </a>
    </main>
  );
}
