"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Turnstile from "@/components/turnstile";
import { acaoBloquearUsuario, acaoExcluirUsuario, acaoRegistrarRecuperacao } from "./actions";

export interface Usuario {
  id: string;
  nome: string | null;
  email: string;
  criado_em: string;
  ultimo_login: string | null;
  confirmado: boolean;
  bloqueado: boolean;
  provedor: string | null;
  administrador: boolean;
  cadastro_cidade: string | null;
  cadastro_regiao: string | null;
  cadastro_pais: string | null;
  ultimo_acesso: string | null;
  ultimo_cidade: string | null;
  ultimo_regiao: string | null;
  ultimo_pais: string | null;
  planos: number;
  escolas: number;
}

const dataHora = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }) : "—");
const local = (c: string | null, r: string | null, p: string | null) => [c, r, p].filter(Boolean).join(", ") || "não registrado";

type Aberto = { id: string; modo: "excluir" | "recuperar" } | null;

export default function ListaUsuarios({ usuarios, chaveServidor }: { usuarios: Usuario[]; chaveServidor: boolean }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [aberto, setAberto] = useState<Aberto>(null);
  const [confirmacao, setConfirmacao] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  function fechar() {
    setAberto(null);
    setConfirmacao("");
    setToken(null);
  }

  function alternarPainel(id: string, modo: "excluir" | "recuperar") {
    setMsg(null);
    setConfirmacao("");
    setToken(null);
    setAberto((atual) => (atual?.id === id && atual.modo === modo ? null : { id, modo }));
  }

  function bloquear(u: Usuario) {
    const bloquear = !u.bloqueado;
    const texto = bloquear ? `Bloquear ${u.email}? A pessoa será desconectada e não conseguirá entrar até você liberar.` : `Liberar ${u.email}?`;
    if (!window.confirm(texto)) return;
    setMsg(null);
    iniciar(async () => {
      const r = await acaoBloquearUsuario(u.id, bloquear);
      if (r.erro) setMsg({ tipo: "erro", texto: r.erro });
      else {
        setMsg({ tipo: "ok", texto: bloquear ? "Conta bloqueada." : "Conta liberada." });
        router.refresh();
      }
    });
  }

  function excluir(u: Usuario) {
    setMsg(null);
    iniciar(async () => {
      const r = await acaoExcluirUsuario(u.id, confirmacao);
      if (r.erro) setMsg({ tipo: "erro", texto: r.erro });
      else {
        setMsg({ tipo: "ok", texto: "Conta excluída." });
        fechar();
        router.refresh();
      }
    });
  }

  async function recuperar(u: Usuario) {
    if (!token) {
      setMsg({ tipo: "erro", texto: "Confirme que você não é um robô." });
      return;
    }
    setMsg(null);
    const captchaToken = token;
    setToken(null);
    setTurnstileKey((k) => k + 1);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(u.email, {
      redirectTo: `${window.location.origin}/auth/confirm?type=recovery&next=/redefinir-senha`,
      captchaToken,
    });
    if (error) {
      setMsg({ tipo: "erro", texto: "Não foi possível enviar o e-mail agora. Tente de novo em alguns instantes." });
      return;
    }
    await acaoRegistrarRecuperacao(u.id);
    setMsg({ tipo: "ok", texto: `E-mail de recuperação enviado para ${u.email}.` });
    fechar();
    router.refresh();
  }

  if (usuarios.length === 0) {
    return <p className="mt-4 text-sm text-slate-500">Nenhum usuário encontrado.</p>;
  }

  return (
    <div className="mt-4">
      {msg && (
        <p role={msg.tipo === "erro" ? "alert" : "status"} className={`mb-3 rounded-lg border px-3 py-2 text-sm ${msg.tipo === "erro" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {msg.texto}
        </p>
      )}
      <ul className="space-y-3">
        {usuarios.map((u) => (
          <li key={u.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {u.nome || "(sem nome)"}
                  {u.administrador && <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">admin</span>}
                  {u.bloqueado && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">bloqueado</span>}
                  {!u.confirmado && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">e-mail não confirmado</span>}
                </p>
                <p className="truncate text-sm text-slate-600">{u.email}</p>
              </div>
              {!u.administrador && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={pendente} onClick={() => alternarPainel(u.id, "recuperar")} className="btn-secondary !px-3 !py-1.5 text-sm">
                    Recuperar senha
                  </button>
                  <button type="button" disabled={pendente} onClick={() => bloquear(u)} className="btn-secondary !px-3 !py-1.5 text-sm">
                    {u.bloqueado ? "Liberar" : "Bloquear"}
                  </button>
                  <button type="button" disabled={pendente} onClick={() => alternarPainel(u.id, "excluir")} className="btn-text-danger text-sm">
                    Excluir
                  </button>
                </div>
              )}
            </div>
            <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="inline font-semibold">Cadastro: </dt>
                <dd className="inline">{dataHora(u.criado_em)}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Último login: </dt>
                <dd className="inline">{dataHora(u.ultimo_login)}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Entrada: </dt>
                <dd className="inline">{u.provedor === "google" ? "Google" : "E-mail e senha"}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Local do 1º acesso: </dt>
                <dd className="inline">{local(u.cadastro_cidade, u.cadastro_regiao, u.cadastro_pais)}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Último local: </dt>
                <dd className="inline">{local(u.ultimo_cidade, u.ultimo_regiao, u.ultimo_pais)}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Uso: </dt>
                <dd className="inline">
                  {u.planos} plano(s), {u.escolas} escola(s)
                </dd>
              </div>
            </dl>

            {aberto?.id === u.id && aberto.modo === "recuperar" && (
              <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm text-slate-700">Enviar um e-mail com link para {u.email} criar uma nova senha.</p>
                <Turnstile key={turnstileKey} onToken={setToken} />
                <div className="flex gap-2">
                  <button type="button" onClick={() => recuperar(u)} disabled={!token} className="btn-primary !px-4 !py-2 text-sm">
                    Enviar e-mail
                  </button>
                  <button type="button" onClick={fechar} className="btn-secondary !px-4 !py-2 text-sm">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {aberto?.id === u.id && aberto.modo === "excluir" && (
              <div className="mt-4 space-y-3 rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-semibold text-red-800">Excluir para sempre a conta de {u.email}?</p>
                <p className="text-xs text-red-700">Apaga a conta, escolas, planos, arquivos e respostas dessa pessoa. Não dá para desfazer.</p>
                {!chaveServidor && <p className="text-xs font-semibold text-amber-800">A chave secreta do servidor ainda não foi configurada na Vercel: a exclusão não vai funcionar até lá.</p>}
                <div>
                  <label htmlFor={`conf-${u.id}`} className="field-label">
                    Digite o e-mail para confirmar
                  </label>
                  <input id={`conf-${u.id}`} type="email" autoComplete="off" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className="input-field" />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => excluir(u)}
                    disabled={pendente || confirmacao.trim().toLowerCase() !== u.email.toLowerCase()}
                    className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pendente ? "Excluindo..." : "Excluir para sempre"}
                  </button>
                  <button type="button" onClick={fechar} className="btn-secondary !px-4 !py-2 text-sm">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
