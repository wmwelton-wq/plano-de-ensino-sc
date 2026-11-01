"use client";

import { useState } from "react";

/**
 * IFA (Ensino Médio): campo para o professor colar o link da pasta do Drive. Depois de preencher, ele pode pedir
 * que o link seja sugerido nos próximos planos da mesma disciplina; ao abrir um plano novo dessa disciplina, o
 * link aparece como sugestão e basta um clique em "Usar este link".
 */
export default function IfaCampo({
  valorInicial,
  disciplinaId,
  disciplinaNome,
  sugestoes,
}: {
  valorInicial?: string | null;
  /** Disciplina escolhida no plano (vazio para curso técnico: a sugestão é por disciplina). */
  disciplinaId?: string;
  disciplinaNome?: string;
  /** Links já guardados pelo professor: { disciplina_id: url }. */
  sugestoes: Record<string, string>;
}) {
  const [link, setLink] = useState(valorInicial ?? "");
  const sugestao = disciplinaId ? sugestoes[disciplinaId] : undefined;
  // Se este plano já usa o link guardado, a caixa começa marcada; plano novo com link novo também.
  const [sugerir, setSugerir] = useState<boolean>(Boolean(sugestao && sugestao === valorInicial) || !valorInicial);
  const linkLimpo = link.trim();
  const mostrarSugestao = Boolean(sugestao) && linkLimpo !== sugestao;

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <input type="hidden" name="tem_ifa" value="1" />
      <label htmlFor="ifa_link" className="field-label">
        IFA (Ensino Médio) — link do Drive
      </label>
      <p className="text-xs text-slate-500">
        Cole o link da pasta do Google Drive com o material do IFA deste plano. Ele aparece no plano impresso. Pode deixar em branco.
      </p>
      <input
        id="ifa_link"
        name="ifa_link"
        type="url"
        inputMode="url"
        maxLength={500}
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="https://drive.google.com/drive/folders/..."
        className="input-field mt-1"
        autoComplete="off"
      />

      {mostrarSugestao && (
        <div role="status" className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-slate-700">
          <span className="min-w-0 flex-1 break-all">
            Link sugerido{disciplinaNome ? ` para ${disciplinaNome}` : ""}: <strong>{sugestao}</strong>
          </span>
          <button
            type="button"
            className="btn-secondary shrink-0"
            onClick={() => {
              setLink(sugestao ?? "");
              setSugerir(true);
            }}
          >
            Usar este link
          </button>
        </div>
      )}

      {disciplinaId && linkLimpo && (
        <div className="mt-2">
          <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              name="ifa_sugerir"
              checked={sugerir}
              onChange={(e) => setSugerir(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary-600"
            />
            <span>Sugerir este link nos próximos planos desta disciplina</span>
          </label>
          {sugerir && (
            <p role="status" className="mt-1 text-xs font-semibold text-emerald-700">
              Ao salvar, este link será sugerido automaticamente nos próximos planos de {disciplinaNome ?? "esta disciplina"}; você escolhe se quer usá-lo.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
