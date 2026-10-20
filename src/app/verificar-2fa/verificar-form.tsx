"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LogoutButton from "@/app/dashboard/logout-button";
import { mensagemDoErroDaChave, navegadorSuportaChave, usarCredencial } from "@/lib/webauthn-cliente";
import { acaoConcluirLoginChave, acaoConfirmarCodigo, acaoEnviarCodigo, acaoOpcoesLoginChave } from "./actions";

type Metodo = "totp" | "email" | "chave";

export default function VerificarForm({
  totp,
  chave,
  email,
  emailConfiguradoMasIndisponivel,
}: {
  totp: boolean;
  chave: boolean;
  email: boolean;
  emailConfiguradoMasIndisponivel: boolean;
}) {
  const router = useRouter();
  const disponiveis: Metodo[] = [totp ? "totp" : null, chave ? "chave" : null, email ? "email" : null].filter(Boolean) as Metodo[];
  const [metodo, setMetodo] = useState<Metodo | null>(disponiveis[0] ?? null);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState(false);

  function concluir() {
    router.replace("/dashboard");
    router.refresh();
  }

  async function confirmarTotp(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOcupado(true);
    const supabase = createClient();
    const { data: fatores } = await supabase.auth.mfa.listFactors();
    const fator = fatores?.totp?.find((f) => f.status === "verified");
    if (!fator) {
      setOcupado(false);
      setErro("Nenhum app autenticador está ativado nesta conta.");
      return;
    }
    const { data: desafio, error: e1 } = await supabase.auth.mfa.challenge({ factorId: fator.id });
    if (e1 || !desafio) {
      setOcupado(false);
      setErro("Não foi possível iniciar a verificação. Tente de novo em instantes.");
      return;
    }
    const { error: e2 } = await supabase.auth.mfa.verify({ factorId: fator.id, challengeId: desafio.id, code: codigo.replace(/\s/g, "") });
    setOcupado(false);
    if (e2) {
      setErro("Código incorreto ou vencido. Confira o app e tente de novo.");
      return;
    }
    concluir();
  }

  async function enviarEmail() {
    setErro(null);
    setAviso(null);
    setOcupado(true);
    const r = await acaoEnviarCodigo("login");
    setOcupado(false);
    if (!r.ok) {
      setErro(r.erro);
      return;
    }
    setCodigoEnviado(true);
    setAviso("Enviamos um código de 6 números para o e-mail da sua conta. Ele vale por 10 minutos.");
  }

  async function confirmarEmail(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOcupado(true);
    const r = await acaoConfirmarCodigo(codigo, "login");
    setOcupado(false);
    if (!r.ok) {
      setErro(r.erro);
      return;
    }
    concluir();
  }

  async function usarChave() {
    setErro(null);
    setAviso(null);
    if (!navegadorSuportaChave()) {
      setErro("Este navegador não suporta chaves de segurança. Use Chrome, Edge, Firefox ou Safari atualizados.");
      return;
    }
    setOcupado(true);
    try {
      const o = await acaoOpcoesLoginChave();
      if (!o.ok) {
        setErro(o.erro);
        return;
      }
      setAviso("Toque na sua chave de segurança quando ela piscar.");
      const resposta = await usarCredencial(o.opcoes);
      const r = await acaoConcluirLoginChave(resposta);
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      concluir();
    } catch (e) {
      setErro(mensagemDoErroDaChave(e));
    } finally {
      setOcupado(false);
    }
  }

  const rotulo: Record<Metodo, string> = { totp: "App autenticador", chave: "Chave de segurança", email: "Código por e-mail" };

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Verificação em duas etapas</h1>
      <p className="mt-1 text-sm text-slate-500">Escolha como confirmar que é você.</p>

      {disponiveis.length === 0 && (
        <p role="alert" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {emailConfiguradoMasIndisponivel
            ? "Sua conta usa o código por e-mail, mas o envio de e-mail ou a chave segura do servidor não estão configurados agora. Tente de novo mais tarde."
            : "Nenhum método de verificação está disponível agora. Tente de novo mais tarde."}
        </p>
      )}

      {disponiveis.length > 1 && (
        <div role="tablist" aria-label="Método de verificação" className="mt-5 flex flex-wrap gap-2">
          {disponiveis.map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={metodo === m}
              onClick={() => {
                setMetodo(m);
                setErro(null);
                setAviso(null);
                setCodigo("");
              }}
              className={metodo === m ? "rounded-xl bg-slate-900 px-3 py-1.5 text-sm font-bold text-white" : "rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"}
            >
              {rotulo[m]}
            </button>
          ))}
        </div>
      )}

      {metodo === "totp" && (
        <form onSubmit={confirmarTotp} className="mt-5 space-y-4">
          <div>
            <label htmlFor="codigo-totp" className="field-label">
              Código do app autenticador
            </label>
            <input id="codigo-totp" inputMode="numeric" autoComplete="one-time-code" maxLength={8} required value={codigo} onChange={(e) => setCodigo(e.target.value)} className="input-field tracking-[0.3em]" />
            <p className="mt-1 text-xs text-slate-500">Abra o app (Google Authenticator, Microsoft Authenticator, Authy…) e digite os 6 números.</p>
          </div>
          <button type="submit" disabled={ocupado} className="btn-primary w-full">
            {ocupado ? "Conferindo..." : "Confirmar"}
          </button>
        </form>
      )}

      {metodo === "email" && (
        <div className="mt-5 space-y-4">
          {!codigoEnviado ? (
            <button type="button" onClick={enviarEmail} disabled={ocupado} className="btn-primary w-full">
              {ocupado ? "Enviando..." : "Enviar código para o meu e-mail"}
            </button>
          ) : (
            <form onSubmit={confirmarEmail} className="space-y-4">
              <div>
                <label htmlFor="codigo-email" className="field-label">
                  Código recebido por e-mail
                </label>
                <input id="codigo-email" inputMode="numeric" autoComplete="one-time-code" maxLength={8} required value={codigo} onChange={(e) => setCodigo(e.target.value)} className="input-field tracking-[0.3em]" />
              </div>
              <button type="submit" disabled={ocupado} className="btn-primary w-full">
                {ocupado ? "Conferindo..." : "Confirmar"}
              </button>
              <button type="button" onClick={enviarEmail} disabled={ocupado} className="link-primary w-full text-center text-sm">
                Enviar um novo código
              </button>
            </form>
          )}
        </div>
      )}

      {metodo === "chave" && (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-slate-600">Conecte sua chave de segurança USB (ou aproxime-a, se for NFC) e toque nela quando pedir.</p>
          <button type="button" onClick={usarChave} disabled={ocupado} className="btn-primary w-full">
            {ocupado ? "Aguardando a chave..." : "Usar minha chave de segurança"}
          </button>
        </div>
      )}

      {aviso && (
        <p role="status" className="mt-4 text-sm text-slate-600">
          {aviso}
        </p>
      )}
      {erro && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {erro}
        </p>
      )}

      <div className="mt-6 flex justify-center border-t border-slate-100 pt-4">
        <LogoutButton />
      </div>
    </div>
  );
}
