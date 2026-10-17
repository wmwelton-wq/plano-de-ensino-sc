import Link from "next/link";

interface VoltarLinkProps {
  /** Para onde o botão leva. Padrão: tela de escolha da etapa. */
  href?: string;
  rotulo?: string;
}

/** Botão "Voltar" usado no topo das telas de criação/edição de plano. */
export default function VoltarLink({
  href = "/dashboard/planos/novo",
  rotulo = "Voltar",
}: VoltarLinkProps) {
  return (
    <Link
      href={href}
      className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
    >
      <span aria-hidden="true">←</span> {rotulo}
    </Link>
  );
}
