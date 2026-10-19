"use client";

import { useState, useTransition } from "react";
import { configurarProtecao, religarIA } from "./actions";

interface Props {
  gastoHora: number;
  chamadasHora: number;
  usuarioMinuto: number;
  usuarioHora: number;
}

const paraNumero = (v: string) => Number(v.replace(",", "."));

export function ControlesProtecao({ gastoHora, chamadasHora, usuarioMinuto, usuarioHora }: Props) {
  const [pendente, iniciar] = useTransition();
  const [g, setG] = useState(String(gastoHora));
  const [c, setC] = useState(String(chamadasHora));
  const [m, setM] = useState(String(usuarioMinuto));
  const [h, setH] = useState(String(usuarioHora));
  const [msg, setMsg] = useState<string | null>(null);

  function salvar() {
    setMsg(null);
    iniciar(async () => {
      const r = await configurarProtecao(paraNumero(g), paraNumero(c), paraNumero(m), paraNumero(h));
      setMsg(r.ok ? "Salvo." : r.erro ?? "Erro.");
    });
  }

  return (
    <div className="card p-5">
      <h2 className="text-lg font-bold text-slate-900">Tetos e limites</h2>
      <p className="mt-1 text-sm text-slate-500">Valores usados pela barreira. Se ficar em dúvida, deixe como está.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="p-gasto" className="field-label">
            Disjuntor: gasto máximo em 1 hora (US$)
          </label>
          <input id="p-gasto" inputMode="decimal" value={g} onChange={(e) => setG(e.target.value)} className="input-field" />
        </div>
        <div>
          <label htmlFor="p-chamadas" className="field-label">
            Disjuntor: chamadas máximas em 1 hora (todos)
          </label>
          <input id="p-chamadas" inputMode="numeric" value={c} onChange={(e) => setC(e.target.value)} className="input-field" />
        </div>
        <div>
          <label htmlFor="p-min" className="field-label">
            Por professor: pedidos de IA por minuto
          </label>
          <input id="p-min" inputMode="numeric" value={m} onChange={(e) => setM(e.target.value)} className="input-field" />
        </div>
        <div>
          <label htmlFor="p-hora" className="field-label">
            Por professor: pedidos de IA por hora
          </label>
          <input id="p-hora" inputMode="numeric" value={h} onChange={(e) => setH(e.target.value)} className="input-field" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={salvar} disabled={pendente} className="btn-azul">
          {pendente ? "Salvando…" : "Salvar tetos"}
        </button>
        {msg && (
          <span role="status" className="text-sm text-slate-600">
            {msg}
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-500">Administradores e contas liberadas ficam fora dos limites por professor, mas o disjuntor vale para todos.</p>
    </div>
  );
}

export function BotaoReligar() {
  const [pendente, iniciar] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pendente}
        onClick={() => {
          setMsg(null);
          iniciar(async () => {
            const r = await religarIA();
            setMsg(r.ok ? "IA religada." : r.erro ?? "Erro.");
          });
        }}
        className="btn-azul"
      >
        {pendente ? "Religando…" : "Revisei e quero religar a IA"}
      </button>
      {msg && (
        <span role="status" className="text-sm text-slate-700">
          {msg}
        </span>
      )}
    </div>
  );
}
