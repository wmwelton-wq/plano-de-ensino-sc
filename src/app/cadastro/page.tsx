"use client";

import { Icone } from "@/components/icones";
import { useState } from "react";
import Link from "next/link";
import { Ilustracao } from "@/components/ilustracoes";
import AuthLayout from "@/components/auth-layout";
import AvisoSpam from "@/components/aviso-spam";
import RegrasSenha from "@/components/regras-senha";
import { traduzirErroAuth } from "@/lib/erros-auth";
import { createClient } from "@/lib/supabase/client";
import Turnstile from "@/components/turnstile";
import { verificarTurnstile } from "@/lib/turnstile-client";
import { TEXTO_ACEITE, VERSAO_DOCUMENTOS_LEGAIS } from "@/lib/legal";

export default function CadastroPage() {
  const supabase = createClient();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [aceitou, setAceitou] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (!aceitou) {
      setErro("Para criar a conta, leia e aceite os Termos de Uso e o Aviso de Privacidade.");
      return;
    }

    if (!turnstileToken) {
      setErro("Confirme que você não é um robô.");
      return;
    }

    setCarregando(true);

    const humano = await verificarTurnstile(turnstileToken);
    setTurnstileToken(null);
    setTurnstileKey((k) => k + 1);

    if (!humano) {
      setErro("Não foi possível confirmar que você não é um robô. Tente novamente.");
      setCarregando(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        // Registro do aceite (versão dos documentos e momento do aceite).
        data: {
          nome,
          aceite_termos_versao: VERSAO_DOCUMENTOS_LEGAIS,
          aceite_termos_em: new Date().toISOString(),
        },
      },
    });

    setCarregando(false);

    if (error) {
      setErro(traduzirErroAuth(error.message));
      return;
    }

    setSucesso(true);
  }

  if (sucesso) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden fundo-auth px-4 py-10">
        <div className="card painel-entra relative w-full max-w-lg overflow-hidden text-center">
          <div data-tom="azul" className="atalho-arte px-6 pt-6">
            <div className="mx-auto h-36 w-60">
              <Ilustracao nome="email" tom="azul" />
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Quase lá! Confirme seu e-mail</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Enviamos uma mensagem de boas-vindas com o link de confirmação para <strong className="break-all text-slate-900">{email}</strong>.
              Abra o e-mail e clique em <strong>“Confirmar meu e-mail”</strong> para ativar sua conta.
            </p>
            <AvisoSpam />
            <Link href="/login" className="btn-primary mt-6 w-full">
              Ir para o login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AuthLayout
      voltarHref="/login"
      voltarRotulo="Voltar para o login"
      ilustracao="login"
      titulo="Crie sua conta e monte seus planos com mais tranquilidade"
      texto="Em poucos minutos você cadastra a escola e começa o plano anual e os planos mensais no formato do Estado."
      topicos={["Planos anuais e mensais no formato exigido pelo Estado", "Baixe em PDF ou Word, ou imprima", "Seus planos ficam guardados na sua conta"]}
    >
      <div>
        <div className="card p-6 sm:p-8">
          <h1 className="text-xl font-semibold text-slate-900">Criar conta</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre-se para começar a criar seus planos de ensino.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="nome" className="field-label">
                Nome completo
              </label>
              <input
                id="nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="senha" className="field-label">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="input-field"
              />
              <RegrasSenha senha={senha} />
            </div>

            <div className="flex items-start gap-2.5">
              <input
                id="aceite"
                type="checkbox"
                required
                checked={aceitou}
                onChange={(e) => setAceitou(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-primary-600 focus:ring-2 focus:ring-primary-500/40"
              />
              <label htmlFor="aceite" className="text-sm leading-snug text-slate-600">
                Li e aceito os{" "}
                <Link
                  href="/termos-de-uso"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-primary"
                >
                  Termos de Uso
                </Link>{" "}
                e o{" "}
                <Link
                  href="/privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-primary"
                >
                  Aviso de Privacidade
                </Link>
                . {TEXTO_ACEITE}
              </label>
            </div>

            <Turnstile key={turnstileKey} onToken={setTurnstileToken} />

            {erro && (
              <p role="alert" className="text-sm text-red-600">
                {erro}
              </p>
            )}

            <button type="submit" disabled={carregando} className="btn-primary w-full">
              {carregando ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Já tem conta? <Link href="/login" className="link-primary">Entrar</Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
