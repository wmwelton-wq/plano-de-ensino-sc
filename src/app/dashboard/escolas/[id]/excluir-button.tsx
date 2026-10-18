"use client";

import ConfirmarExclusao from "@/components/confirmar-exclusao";

/** Excluir escola: mostra um aviso bem visível antes de apagar. */
export default function ExcluirButton({
  excluirAction,
}: {
  excluirAction: () => Promise<void>;
}) {
  return (
    <ConfirmarExclusao
      excluirAction={excluirAction}
      rotulo="Excluir escola"
      oQue="esta escola"
      classeBotao="btn-text-danger"
      detalhe="Os planos que usam esta escola continuam existindo, mas ficam sem escola definida."
    />
  );
}
