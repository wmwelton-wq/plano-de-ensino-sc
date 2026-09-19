"use client";

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
      <button
        type="submit"
        className="text-sm font-medium text-red-600 hover:text-red-800"
      >
        Excluir plano
      </button>
    </form>
  );
}
