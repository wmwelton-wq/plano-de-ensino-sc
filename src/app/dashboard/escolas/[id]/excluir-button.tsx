"use client";

import { useFormStatus } from "react-dom";

function BotaoExcluir() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn-text-danger disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Excluindo…" : "Excluir escola"}
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
        if (!confirm("Tem certeza que deseja excluir esta escola?")) {
          e.preventDefault();
        }
      }}
    >
      <BotaoExcluir />
    </form>
  );
}
