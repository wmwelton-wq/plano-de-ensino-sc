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
        if (!confirm("Tem certeza que deseja excluir esta escola?")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="btn-text-danger"
      >
        Excluir escola
      </button>
    </form>
  );
}
