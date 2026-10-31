"use client";

import Link from "next/link";
import { useState } from "react";
import { confirmarExclusaoConta, enviarCodigoExclusao } from "./excluir-conta-actions";

type Etapa = "inicio" | "aviso" | "codigo" | "feito";

export default function ExcluirConta({ email }: { email: string }) {
  const [etapa, setEtapa] = useState<Etapa>("inicio");
  const [entendi, setEntendi] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function cancelar() {
    setEtapa("inicio");
    setEntendi(false);
    setCodigo("");
    setErro(null);
    setAviso(null);
  }

  async function enviarCodigo(reenvio: boolean) {
    setOcupado(true);
    setErro(null);
    setAviso(null);
    const r = await enviarCodigoExclusao();
    setOcupado(false);
    if (r.erro) {
      setErro(r.erro);
      return;
    }
    setEtapa("codigo");
    setAviso(reenvio ? "Enviamos um novo código para o seu e-mail." : "Enviamos um código de 6 números para o seu e-mail.");
  }

  async function excluir(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setErro(null);
    const r = await confirmarExclusaoConta(codigo);
    if (r.erro) {
      setOcupado(false);
      setErro(r.erro);
      return;
    }
    setEtapa("feito");
    window.setTimeout(() => {
      window.location.href = "/";
    }, 3500);
  }

  if (etapa === "feito") {
    return (
      <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
        Sua conta e todos os seus dados foram excluídos. Você será levado à página inicial.
      </p>
    );
  }

  return (
    <div className="mt-4">
      {etapa === "inicio" && (
        <button type="button" onClick={() => setEtapa("aviso")} className="btn-perigo-suave">
          Excluir minha conta
        </button>
      )}

      {etapa !== "inicio" && (
        <div className="space-y-4 rounded-xl border border-red-200 bg-red-50/60 p-4">
          <div role="alert" className="space-y-2 text-sm text-red-900">
            <p className="font-bold">Atenção: esta ação é permanente.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Todos os seus dados serão apagados</strong>: planos mensais e anuais, escolas, turmas, calendários, logos e PDFs
                compartilhados. Não será possível recuperar nada depois.
              </li>
              <li>
                <strong>Pode não haver reembolso</strong> de valores já pagos. Veja a{" "}
                <Link href="/reembolso" className="font-semibold underline" target="_blank">
                  Política de Reembolso
                </Link>{" "}
                antes de continuar.
              </li>
              <li>Antes de excluir, baixe os PDFs que quiser guardar.</li>
            </ul>
          </div>

          {etapa === "aviso" && (
            <>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={entendi}
                  onChange={(e) => setEntendi(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span>Entendo que meus dados serão apagados para sempre e que pode não haver reembolso.</span>
              </label>
              <p className="text-sm text-slate-600">
                Para confirmar que é você, vamos enviar um código de segurança para <strong>{email}</strong>.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!entendi || ocupado}
                  onClick={() => enviarCodigo(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50"
                >
                  {ocupado ? "Enviando..." : "Enviar código para o meu e-mail"}
                </button>
                <button type="button" onClick={cancelar} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </>
          )}

          {etapa === "codigo" && (
            <form onSubmit={excluir} className="space-y-3">
              {aviso && (
                <p role="status" className="text-sm font-semibold text-emerald-800">
                  {aviso}
                </p>
              )}
              <div>
                <label htmlFor="codigo-exclusao" className="field-label">
                  Código recebido por e-mail
                </label>
                <input
                  id="codigo-exclusao"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="input-field max-w-[12rem] tracking-[0.4em]"
                />
                <p className="mt-1 text-xs text-slate-500">O código vale por 10 minutos. Olhe também a caixa de spam.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={codigo.length !== 6 || ocupado}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50"
                >
                  {ocupado ? "Excluindo..." : "Excluir minha conta definitivamente"}
                </button>
                <button type="button" disabled={ocupado} onClick={() => enviarCodigo(true)} className="btn-secondary">
                  Reenviar código
                </button>
                <button type="button" disabled={ocupado} onClick={cancelar} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {erro && (
            <p role="alert" className="text-sm font-semibold text-red-700">
              {erro}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
