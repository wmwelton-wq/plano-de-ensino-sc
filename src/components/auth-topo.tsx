import Link from "next/link";
import Logo from "@/components/logo";
import VoltarLink from "@/app/dashboard/planos/voltar-link";

/** Topo das telas de entrada (login, cadastro, senha): botão voltar e a logo do Plano Docente. */
export default function AuthTopo({ voltarHref, voltarRotulo }: { voltarHref: string; voltarRotulo: string }) {
  return (
    <div className="mb-6">
      <VoltarLink href={voltarHref} rotulo={voltarRotulo} className="" />
      <div className="mt-5 flex justify-center">
        <Link href="/" aria-label="Plano Docente — página inicial" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
          <Logo />
        </Link>
      </div>
    </div>
  );
}
