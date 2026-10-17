"use client";

import { useFormStatus } from "react-dom";

function BotaoExcluir() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn-perigo-suave disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Excluindo…" : "Excluir plano"}
    </button>
  );
}

export default function ExcluirButton({
  excluirAction,
}: {
  excluirAction: () => Promise<void>;
}) {
  return (
    <form
      action={excluirAction}
      onSubmit={(e) => {
        if (!confirm("Tem certeza que deseja excluir este plano de ensino?")) {
          e.preventDefault();
        }
      }}
    >
      <BotaoExcluir />
    </form>
  );
}
