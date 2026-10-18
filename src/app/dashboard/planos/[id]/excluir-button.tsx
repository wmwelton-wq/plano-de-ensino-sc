"use client";

import ConfirmarExclusao from "@/components/confirmar-exclusao";

/** Excluir plano (mensal ou anual): mostra um aviso bem visível antes de apagar. */
export default function ExcluirButton({
  excluirAction,
}: {
  excluirAction: () => Promise<void>;
}) {
  return <ConfirmarExclusao excluirAction={excluirAction} rotulo="Excluir plano" oQue="este plano de ensino" />;
}
