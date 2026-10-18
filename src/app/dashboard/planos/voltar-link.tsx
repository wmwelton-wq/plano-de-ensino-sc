import Link from "next/link";
import { Icone } from "@/components/icones";

interface VoltarLinkProps {
  /** Para onde o botão leva. Padrão: tela de escolha da etapa. */
  href?: string;
  rotulo?: string;
  className?: string;
}

/** Botão "Voltar" no topo das telas. Sempre leva um nível acima (nunca "para a página que veio antes"). */
export default function VoltarLink({
  href = "/dashboard/planos/novo",
  rotulo = "Voltar",
  className = "mb-4",
}: VoltarLinkProps) {
  return (
    <Link href={href} className={`btn-voltar ${className}`}>
      <Icone nome="setaEsquerda" className="h-4 w-4" espessura={2.2} />
      {rotulo}
    </Link>
  );
}
