interface BarraSalvarProps {
  pendente: boolean;
  textoBotao: string;
  erro?: string;
}

/** Barra fixa no rodapé do formulário: o botão de salvar fica sempre à mão. */
export default function BarraSalvar({ pendente, textoBotao, erro }: BarraSalvarProps) {
  return (
    <div className="sticky bottom-4 z-[5] space-y-2">
      {erro && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 shadow-sm">
          {erro}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary-200/70 bg-white/90 px-4 py-3 shadow-lg shadow-primary-900/10 backdrop-blur">
        <p className="text-sm text-slate-600">Terminou os passos? Salve o plano — dá para editar depois.</p>
        <button type="submit" disabled={pendente} className="btn-azul">
          {pendente ? "Salvando..." : textoBotao}
        </button>
      </div>
    </div>
  );
}
