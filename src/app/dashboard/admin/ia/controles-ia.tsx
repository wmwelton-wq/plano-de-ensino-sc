"use client";

import { useState, useTransition } from "react";
import { configurarIA, testarIAs } from "./actions";
import type { ResultadoTeste } from "@/lib/ia/provedores";

export function ControleIA({ habilitada, limite }: { habilitada: boolean; limite: number }) {
  const [pendente, iniciar] = useTransition();
  const [valor, setValor] = useState(String(limite));
  const [msg, setMsg] = useState<string | null>(null);

  function salvar(h: boolean | null, l: number | null) {
    setMsg(null);
    iniciar(async () => {
      const r = await configurarIA(h, l);
      setMsg(r.ok ? "Salvo." : r.erro ?? "Erro.");
    });
  }

  return (
    <div className="card p-5">
      <h2 className="text-lg font-bold text-slate-900">Controles</h2>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className={habilitada ? "rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800" : "rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-800"}>
          IA {habilitada ? "ligada para todos" : "DESLIGADA para todos"}
        </span>
        <button type="button" disabled={pendente} onClick={() => salvar(!habilitada, null)} className={habilitada ? "btn-perigo-suave" : "btn-azul"}>
          {habilitada ? "Desligar a IA agora" : "Ligar a IA"}
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">Desligar corta o uso da IA de todos os professores na hora (botão de emergência). O restante do aplicativo continua funcionando.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="limite-ia" className="field-label">
            Limite de gasto por mês (US$)
          </label>
          <input id="limite-ia" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className="input-field w-40" />
        </div>
        <button
          type="button"
          disabled={pendente}
          onClick={() => {
            const n = Number(valor.replace(",", "."));
            if (!Number.isFinite(n)) return setMsg("Digite um número.");
            salvar(null, n);
          }}
          className="btn-azul-suave"
        >
          Salvar limite
        </button>
        {msg && (
          <span role="status" className="text-sm text-slate-600">
            {msg}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">Quando o gasto do mês chega no limite, a IA para sozinha até o mês seguinte.</p>
    </div>
  );
}

export function TesteIAs({ configurados }: { configurados: ResultadoTeste[] }) {
  const [pendente, iniciar] = useTransition();
  const [lista, setLista] = useState<ResultadoTeste[]>(configurados);
  const [testado, setTestado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function testar() {
    setErro(null);
    iniciar(async () => {
      const r = await testarIAs();
      if (r.resultados) {
        setLista(r.resultados);
        setTestado(true);
      } else setErro(r.erro ?? "Erro ao testar.");
    });
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Provedores de IA</h2>
          <p className="text-sm text-slate-500">Quem está configurado e a ordem de tentativa. O teste manda uma frase minúscula para cada um (custa frações de centavo).</p>
        </div>
        <button type="button" onClick={testar} disabled={pendente} aria-busy={pendente} className="btn-azul">
          {pendente ? "Testando…" : "Testar todas agora"}
        </button>
      </div>
      {erro && (
        <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </p>
      )}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-1 pr-3 font-semibold">Provedor</th>
              <th className="py-1 pr-3 font-semibold">Modelo</th>
              <th className="py-1 pr-3 font-semibold">Lê PDF</th>
              <th className="py-1 pr-3 font-semibold">Chave</th>
              <th className="py-1 font-semibold">Teste</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.provedor} className="border-t border-slate-100 align-top">
                <td className="py-1.5 pr-3 font-semibold capitalize text-slate-800">{p.provedor}</td>
                <td className="py-1.5 pr-3 text-slate-600">{p.modelo}</td>
                <td className="py-1.5 pr-3 text-slate-600">{p.lePdf ? "sim" : "não"}</td>
                <td className="py-1.5 pr-3">{p.configurado ? <span className="text-emerald-700">configurada</span> : <span className="text-slate-400">sem chave</span>}</td>
                <td className="py-1.5">
                  {!p.configurado ? (
                    <span className="text-slate-400">—</span>
                  ) : !testado ? (
                    <span className="text-slate-400">não testado</span>
                  ) : p.ok ? (
                    <span className="font-semibold text-emerald-700">
                      funcionando · {p.ms} ms
                    </span>
                  ) : (
                    <span className="font-semibold text-red-700">
                      com problema <span className="block max-w-xs break-words text-xs font-normal">{p.erro}</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
