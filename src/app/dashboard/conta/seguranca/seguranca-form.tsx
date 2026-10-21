"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { criarCredencial, mensagemDoErroDaChave, navegadorSuportaChave } from "@/lib/webauthn-cliente";
import { acaoConcluirRegistroChave, acaoConfirmarCodigo, acaoDesativarEmail, acaoEnviarCodigo, acaoOpcoesRegistroChave, acaoRemoverChave, acaoResumoSegundaEtapa } from "@/app/verificar-2fa/actions";

type Chave = { id: string; nome: string; criado_em: string; ultimo_uso: string | null; rp_id: string };
type FatorTotp = { id: string; friendly_name?: string; status: string; created_at?: string };
/** Qual dos três métodos está trabalhando agora (para só o botão certo mostrar "aguarde"). */
type Fazendo = null | "app" | "email" | "chave";

const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" }) : "nunca");

function Aviso({ tipo, children }: { tipo: "erro" | "ok" | "info"; children: React.ReactNode }) {
  const cores = tipo === "erro" ? "border-red-200 bg-red-50 text-red-700" : tipo === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <p role={tipo === "erro" ? "alert" : "status"} className={`mt-3 rounded-lg border px-3 py-2 text-sm ${cores}`}>
      {children}
    </p>
  );
}

export default function SegurancaForm({
  servidorPronto,
  emailEnvioPronto,
  emailDaConta,
  chavesIniciais,
  emailAtivoInicial,
}: {
  servidorPronto: boolean;
  emailEnvioPronto: boolean;
  emailDaConta: string;
  chavesIniciais: Chave[];
  emailAtivoInicial: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [fatores, setFatores] = useState<FatorTotp[]>([]);
  const [chaves, setChaves] = useState<Chave[]>(chavesIniciais);
  const [emailAtivo, setEmailAtivo] = useState(emailAtivoInicial);
  const [msg, setMsg] = useState<{ tipo: "erro" | "ok" | "info"; texto: string } | null>(null);
  // Enquanto qualquer método trabalha, os três botões ficam travados (evita cliques em dobro),
  // mas só o botão do método em andamento troca o texto.
  const [fazendo, setFazendo] = useState<Fazendo>(null);
  const ocupado = fazendo !== null;

  // App autenticador (em andamento)
  const [qr, setQr] = useState<{ id: string; svg: string; segredo: string } | null>(null);
  const [codigoTotp, setCodigoTotp] = useState("");
  // E-mail
  const [codigoEmail, setCodigoEmail] = useState("");
  const [emailEnviado, setEmailEnviado] = useState(false);
  // Chave
  const [nomeChave, setNomeChave] = useState("");

  const recarregarFatores = useCallback(async () => {
    const { data: f } = await supabase.auth.mfa.listFactors();
    setFatores((f?.totp ?? []).map((x) => ({ id: x.id, friendly_name: x.friendly_name ?? undefined, status: x.status, created_at: x.created_at })));
  }, [supabase]);

  const recarregarResto = useCallback(async () => {
    if (!servidorPronto) return;
    const r = await acaoResumoSegundaEtapa();
    if (r.ok) {
      setChaves(r.chaves);
      setEmailAtivo(r.emailAtivo);
    }
  }, [servidorPronto]);

  useEffect(() => {
    void recarregarFatores();
  }, [recarregarFatores]);

  const verificados = fatores.filter((f) => f.status === "verified");
  const totalMetodos = verificados.length + chaves.length + (emailAtivo ? 1 : 0);

  async function iniciarTotp() {
    setMsg(null);
    setFazendo("app");
    // Limpa tentativas antigas que ficaram sem confirmar.
    for (const f of fatores.filter((x) => x.status !== "verified")) await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data: d, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `App ${new Date().toLocaleDateString("pt-BR")}`, issuer: "Plano Docente" });
    setFazendo(null);
    if (error || !d) {
      setMsg({ tipo: "erro", texto: "Não foi possível iniciar a configuração do app. Tente de novo." });
      return;
    }
    setQr({ id: d.id, svg: d.totp.qr_code, segredo: d.totp.secret });
    setCodigoTotp("");
  }

  async function confirmarTotp(e: React.FormEvent) {
    e.preventDefault();
    if (!qr) return;
    setMsg(null);
    setFazendo("app");
    const { data: desafio, error: e1 } = await supabase.auth.mfa.challenge({ factorId: qr.id });
    if (e1 || !desafio) {
      setFazendo(null);
      setMsg({ tipo: "erro", texto: "Não foi possível conferir o código. Tente de novo." });
      return;
    }
    const { error: e2 } = await supabase.auth.mfa.verify({ factorId: qr.id, challengeId: desafio.id, code: codigoTotp.replace(/\s/g, "") });
    setFazendo(null);
    if (e2) {
      setMsg({ tipo: "erro", texto: "Código incorreto. Confira o app e tente de novo." });
      return;
    }
    setQr(null);
    setMsg({ tipo: "ok", texto: "App autenticador ativado." });
    await recarregarFatores();
  }

  async function cancelarTotp() {
    if (qr) await supabase.auth.mfa.unenroll({ factorId: qr.id });
    setQr(null);
    await recarregarFatores();
  }

  async function removerTotp(id: string) {
    if (!window.confirm("Remover este app autenticador? Você precisará confirmar a identidade na segunda etapa.")) return;
    setMsg(null);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) {
      setMsg({ tipo: "erro", texto: "Não foi possível remover agora. Saia e entre de novo, confirme a segunda etapa e tente outra vez." });
      return;
    }
    await recarregarFatores();
    setMsg({ tipo: "ok", texto: "App removido." });
  }

  async function pedirCodigoEmail() {
    setMsg(null);
    setFazendo("email");
    try {
      const r = await acaoEnviarCodigo("ativar");
      if (!r.ok) {
        setMsg({ tipo: "erro", texto: r.erro });
        return;
      }
      setEmailEnviado(true);
      setMsg({ tipo: "info", texto: `Enviamos um código de 6 números para ${emailDaConta}. Ele vale por 10 minutos.` });
    } catch {
      setMsg({ tipo: "erro", texto: "Não foi possível falar com o servidor agora. Tente de novo em instantes." });
    } finally {
      setFazendo(null);
    }
  }

  async function confirmarEmail(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setFazendo("email");
    try {
      const r = await acaoConfirmarCodigo(codigoEmail, "ativar");
      if (!r.ok) {
        setMsg({ tipo: "erro", texto: r.erro });
        return;
      }
      setEmailEnviado(false);
      setCodigoEmail("");
      setMsg({ tipo: "ok", texto: "Código por e-mail ativado." });
      await recarregarResto();
    } catch {
      setMsg({ tipo: "erro", texto: "Não foi possível falar com o servidor agora. Tente de novo em instantes." });
    } finally {
      setFazendo(null);
    }
  }

  async function desativarEmail() {
    if (!window.confirm("Desativar o código por e-mail?")) return;
    setMsg(null);
    const r = await acaoDesativarEmail();
    if (!r.ok) {
      setMsg({ tipo: "erro", texto: r.erro });
      return;
    }
    await recarregarResto();
    setMsg({ tipo: "ok", texto: "Código por e-mail desativado." });
  }

  async function cadastrarChave() {
    setMsg(null);
    if (!navegadorSuportaChave()) {
      setMsg({ tipo: "erro", texto: "Este navegador não suporta chaves de segurança." });
      return;
    }
    setFazendo("chave");
    try {
      const o = await acaoOpcoesRegistroChave();
      if (!o.ok) {
        setMsg({ tipo: "erro", texto: o.erro });
        return;
      }
      setMsg({ tipo: "info", texto: "Conecte a chave e toque nela quando ela piscar." });
      const resposta = await criarCredencial(o.opcoes);
      const r = await acaoConcluirRegistroChave(resposta, nomeChave);
      if (!r.ok) {
        setMsg({ tipo: "erro", texto: r.erro });
        return;
      }
      setNomeChave("");
      setMsg({ tipo: "ok", texto: "Chave de segurança cadastrada." });
      await recarregarResto();
    } catch (e) {
      setMsg({ tipo: "erro", texto: mensagemDoErroDaChave(e) });
    } finally {
      setFazendo(null);
    }
  }

  async function apagarChave(id: string) {
    if (!window.confirm("Remover esta chave de segurança?")) return;
    setMsg(null);
    const r = await acaoRemoverChave(id);
    if (!r.ok) {
      setMsg({ tipo: "erro", texto: r.erro });
      return;
    }
    await recarregarResto();
    setMsg({ tipo: "ok", texto: "Chave removida." });
  }

  return (
    <div className="mt-6 space-y-4">
      {!servidorPronto && (
        <Aviso tipo="info">
          A chave secreta do servidor (<code>SUPABASE_SECRET_KEY</code>) ainda não foi colocada na Vercel (ou está com formato inválido). Enquanto isso, só o app autenticador funciona; o código por e-mail e a chave de segurança precisam dela.
        </Aviso>
      )}
      {totalMetodos === 1 && <Aviso tipo="info">Você tem só um método ativo. Cadastre pelo menos dois (por exemplo app + chave) para não ficar sem acesso se perder um deles.</Aviso>}
      {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}

      <section className="card p-6" aria-labelledby="t-app">
        <h2 id="t-app" className="text-lg font-bold text-slate-900">
          App autenticador
        </h2>
        <p className="mt-1 text-sm text-slate-500">Google Authenticator, Microsoft Authenticator, Authy, 1Password… Gera um código de 6 números a cada 30 segundos.</p>
        {verificados.map((f) => (
          <div key={f.id} className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <span>
              Ativado em {data(f.created_at ?? null)}
            </span>
            <button type="button" onClick={() => removerTotp(f.id)} className="btn-text-danger">
              Remover
            </button>
          </div>
        ))}
        {qr ? (
          <form onSubmit={confirmarTotp} className="mt-4 space-y-3">
            <p className="text-sm text-slate-600">Leia o QR code com o app e digite o código que aparecer.</p>
            {/* O QR vem como imagem pronta do Supabase (data URI), por isso <img> e não next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.svg} alt="QR code para o app autenticador" className="h-44 w-44 rounded-lg border border-slate-200 bg-white p-2" />
            <p className="text-xs text-slate-500">
              Sem câmera? Digite esta chave no app: <code className="break-all select-all">{qr.segredo}</code>
            </p>
            <div>
              <label htmlFor="cod-totp" className="field-label">
                Código de 6 números
              </label>
              <input id="cod-totp" inputMode="numeric" autoComplete="one-time-code" maxLength={8} required value={codigoTotp} onChange={(e) => setCodigoTotp(e.target.value)} className="input-field tracking-[0.3em]" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={ocupado} className="btn-primary">
                {fazendo === "app" ? "Conferindo..." : "Ativar"}
              </button>
              <button type="button" onClick={cancelarTotp} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          verificados.length === 0 && (
            <button type="button" onClick={iniciarTotp} disabled={ocupado} className="btn-primary mt-4">
              {fazendo === "app" ? "Preparando..." : "Configurar app autenticador"}
            </button>
          )
        )}
      </section>

      <section className="card p-6" aria-labelledby="t-email">
        <h2 id="t-email" className="text-lg font-bold text-slate-900">
          Código por e-mail
        </h2>
        <p className="mt-1 text-sm text-slate-500">Enviamos um código de 6 números para {emailDaConta}. Vale por 10 minutos e só funciona uma vez.</p>
        {!servidorPronto || !emailEnvioPronto ? (
          <Aviso tipo="info">Disponível depois que a chave secreta do servidor e o envio de e-mails (Resend) estiverem configurados na Vercel.</Aviso>
        ) : emailAtivo ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <span>Ativado</span>
            <button type="button" onClick={desativarEmail} className="btn-text-danger">
              Desativar
            </button>
          </div>
        ) : emailEnviado ? (
          <form onSubmit={confirmarEmail} className="mt-4 space-y-3">
            <div>
              <label htmlFor="cod-email" className="field-label">
                Código recebido
              </label>
              <input id="cod-email" inputMode="numeric" autoComplete="one-time-code" maxLength={8} required value={codigoEmail} onChange={(e) => setCodigoEmail(e.target.value)} className="input-field tracking-[0.3em]" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={ocupado} className="btn-primary">
                {fazendo === "email" ? "Conferindo..." : "Ativar"}
              </button>
              <button type="button" onClick={pedirCodigoEmail} disabled={ocupado} className="btn-secondary">
                Reenviar
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={pedirCodigoEmail} disabled={ocupado} className="btn-primary mt-4">
            {fazendo === "email" ? "Enviando código..." : "Ativar código por e-mail"}
          </button>
        )}
      </section>

      <section className="card p-6" aria-labelledby="t-chave">
        <h2 id="t-chave" className="text-lg font-bold text-slate-900">
          Chave de segurança (USB / NFC)
        </h2>
        <p className="mt-1 text-sm text-slate-500">Funciona com chaves FIDO2, como a Feitian ePass K28. Cadastre-a no endereço oficial (planodocente.com.br): a chave fica vinculada a ele.</p>
        {!servidorPronto ? (
          <Aviso tipo="info">Disponível depois que a chave secreta do servidor estiver configurada na Vercel.</Aviso>
        ) : (
          <>
            {chaves.map((c) => (
              <div key={c.id} className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <span>
                  <strong>{c.nome}</strong> · criada em {data(c.criado_em)} · último uso: {data(c.ultimo_uso)}
                </span>
                <button type="button" onClick={() => apagarChave(c.id)} className="btn-text-danger">
                  Remover
                </button>
              </div>
            ))}
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <div className="min-w-[12rem] flex-1">
                <label htmlFor="nome-chave" className="field-label">
                  Nome da chave (opcional)
                </label>
                <input id="nome-chave" maxLength={40} value={nomeChave} onChange={(e) => setNomeChave(e.target.value)} placeholder="Ex.: Feitian K28" className="input-field" />
              </div>
              <button type="button" onClick={cadastrarChave} disabled={ocupado} className="btn-primary">
                {fazendo === "chave" ? "Aguardando a chave..." : "Cadastrar chave"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
