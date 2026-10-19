interface BarraSalvarProps {
  pendente: boolean;
  textoBotao: string;
  erro?: string;
  salvando?: boolean;
  salvoEm?: Date | null;
  avisoAuto?: string | null;
}

/** Barra fixa no rodapé do formulário: o botão de salvar fica sempre à mão e o plano vai sendo guardado sozinho. */
export default function BarraSalvar({ pendente, textoBotao, erro, salvando = false, salvoEm = null, avisoAuto = null }: BarraSalvarProps) {
  return (
    <div className="sticky bottom-4 z-[5] space-y-2">
      {erro && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 shadow-sm">
          {erro}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white/95 px-4 py-3 shadow-md backdrop-blur">
        <p className={`text-sm ${avisoAuto ? "text-amber-700" : "text-slate-600"}`} aria-live="polite">
          {salvando
            ? "Salvando…"
            : avisoAuto ?? (salvoEm ? `Tudo salvo às ${salvoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}. Terminou? Conclua o plano.` : "Terminou os passos? Conclua o plano — ele também é salvo sozinho enquanto você preenche.")}
        </p>
        <button type="submit" disabled={pendente || salvando} className="btn-azul">
          {pendente ? "Salvando..." : textoBotao}
        </button>
      </div>
    </div>
  );
}
