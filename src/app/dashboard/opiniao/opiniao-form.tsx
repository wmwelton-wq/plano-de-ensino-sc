"use client";

import { useActionState } from "react";
import { enviarOpiniao, type EstadoOpiniao } from "./actions";

function Escala({ nome, legenda }: { nome: string; legenda: [string, string] }) {
  return (
    <div>
      <div className="flex gap-2" role="radiogroup" aria-label={nome}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="flex-1">
            <input type="radio" name={nome} value={n} className="peer sr-only" />
            <span className="flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-lg font-bold text-slate-600 transition peer-checked:border-primary-600 peer-checked:bg-primary-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2">
              {n}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>{legenda[0]}</span>
        <span>{legenda[1]}</span>
      </div>
    </div>
  );
}

export default function OpiniaoForm() {
  const [estado, acao, pendente] = useActionState<EstadoOpiniao, FormData>(enviarOpiniao, {});

  if (estado.ok) {
    return (
      <div role="status" className="card p-6 text-center">
        <div className="text-4xl" aria-hidden="true">
          💙
        </div>
        <p className="mt-2 text-lg font-bold text-slate-900">Obrigado pela sua opinião!</p>
        <p className="mt-1 text-sm text-slate-600">Ela ajuda a melhorar o aplicativo para todos os professores.</p>
      </div>
    );
  }

  return (
    <form action={acao} className="card space-y-6 p-6">
      <div>
        <p className="field-label">1. No geral, como você avalia o aplicativo?</p>
        <Escala nome="nota" legenda={["Ruim", "Excelente"]} />
      </div>
      <div>
        <p className="field-label">2. Foi fácil montar seus planos?</p>
        <Escala nome="facilidade" legenda={["Difícil", "Muito fácil"]} />
      </div>
      <div>
        <label htmlFor="comentario" className="field-label">
          3. O que podemos melhorar? <span className="font-normal text-slate-500">(opcional)</span>
        </label>
        <textarea id="comentario" name="comentario" rows={4} maxLength={2000} className="input-field" placeholder="Conte o que faltou, o que atrapalhou ou o que você mais gostou." />
        <p className="field-hint">Não escreva dados de alunos. Sua resposta é guardada junto da sua conta.</p>
      </div>
      {estado.erro && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {estado.erro}
        </p>
      )}
      <button type="submit" disabled={pendente} className="btn-azul w-full sm:w-auto">
        {pendente ? "Enviando..." : "Enviar opinião"}
      </button>
    </form>
  );
}
