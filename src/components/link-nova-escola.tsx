"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function montar(caminho: string, busca: string): string {
  return `/dashboard/escolas/nova?voltar=${encodeURIComponent(caminho + busca)}`;
}

/**
 * Link "Cadastrar nova escola" que lembra de onde o professor veio: ao salvar (ou clicar em Voltar)
 * ele retorna para a mesma tela (plano, plano anual, calendário...), e não para a lista de escolas.
 */
export default function LinkNovaEscola({ className, children }: { className?: string; children: ReactNode }) {
  const pathname = usePathname();
  const [href, setHref] = useState(() => montar(pathname, ""));

  useEffect(() => {
    const novo = montar(pathname, window.location.search);
    if (novo !== href) setHref(novo);
  });

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
