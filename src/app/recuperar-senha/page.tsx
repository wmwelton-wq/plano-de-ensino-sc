"use client";

import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth-layout";
import AvisoSpam from "@/components/aviso-spam";
import { Ilustracao } from "@/components/ilustracoes";
import { createClient } from "@/lib/supabase/client";
import Turnstile from "@/components/turnstile";

export default function RecuperarSenhaPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!turnstileToken) {
      setErro("Confirme que você não é um robô.");
      return;
    }

    setCarregando(true);

    // O token do Turnstile é de uso único e é conferido pelo próprio Supabase
    // (proteção CAPTCHA do Auth), então vai direto na chamada abaixo.
    const captchaToken = turnstileToken;
    setTurnstileToken(null);
    setTurnstileKey((k) => k + 1);

    const { error: erroEnvio } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?type=recovery&next=/redefinir-senha`,
      captchaToken,
    });

    setCarregando(false);
    if (erroEnvio && erroEnvio.message.toLowerCase().includes("captcha")) {
      setErro("Não foi possível confirmar que você não é um robô. Tente novamente.");
      return;
    }
    // Por segurança, mostramos sempre a mesma mensagem de sucesso, mesmo que
    // o email não esteja cadastrado — assim ninguém descobre quais emails
    // têm conta no sistema só tentando recuperar a senha (evita que um
    // usuário mal-intencionado use isso para investigar contas de outras
    // pessoas).
    setEnviado(true);
  }

  if (enviado) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden fundo-auth px-4 py-10">
        <div className="card painel-entra relative w-full max-w-lg overflow-hidden text-center">
          <div data-tom="azul" className="atalho-arte px-6 pt-6">
            <div className="mx-auto h-36 w-60">
              <Ilustracao nome="email" tom="azul" />
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Verifique seu e-mail</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Se houver uma conta cadastrada com <strong className="break-all text-slate-900">{email}</strong>, enviamos um link para redefinir a senha.
            </p>
            <AvisoSpam />
            <Link href="/login" className="btn-primary mt-6 w-full">
              Voltar para o login
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
      titulo="Esqueceu a senha? Acontece com todo mundo."
      texto="Informe seu e-mail e enviaremos um link seguro para você criar uma nova senha."
      topicos={["O link vale por tempo limitado", "Só você consegue redefinir sua senha", "Em caso de dúvida, fale com contato@planodocente.com.br"]}
    >
      <div>
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Recuperar senha</h1>
          <p className="mt-1 text-sm text-slate-500">
            Informe o email da sua conta para receber um link de redefinição de senha.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

            <Turnstile key={turnstileKey} onToken={setTurnstileToken} />

            {erro && (
              <p role="alert" className="text-sm text-red-600">
                {erro}
              </p>
            )}

            <button type="submit" disabled={carregando} className="btn-primary w-full">
              {carregando ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Lembrou a senha? <Link href="/login" className="link-primary">Entrar</Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
