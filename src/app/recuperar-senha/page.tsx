"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Turnstile from "@/components/turnstile";
import { verificarTurnstile } from "@/lib/turnstile-client";

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

    const humano = await verificarTurnstile(turnstileToken);
    setTurnstileToken(null);
    setTurnstileKey((k) => k + 1);

    if (!humano) {
      setErro("Não foi possível confirmar que você não é um robô. Tente novamente.");
      setCarregando(false);
      return;
    }

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?type=recovery&next=/redefinir-senha`,
    });

    setCarregando(false);
    // Por segurança, mostramos sempre a mesma mensagem de sucesso, mesmo que
    // o email não esteja cadastrado — assim ninguém descobre quais emails
    // têm conta no sistema só tentando recuperar a senha (evita que um
    // usuário mal-intencionado use isso para investigar contas de outras
    // pessoas).
    setEnviado(true);
  }

  if (enviado) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6 py-12">
        <div className="absolute inset-0 bg-grid-slate opacity-60 [mask-image:radial-gradient(ellipse_55%_45%_at_50%_0%,#000_60%,transparent_100%)]" />
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-200/50 blur-3xl" />
        <div className="card relative w-full max-w-sm p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-xl">
            ✉️
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Verifique seu email</h1>
          <p className="mt-2 text-sm text-slate-600">
            Se houver uma conta cadastrada com <strong>{email}</strong>, enviamos um link para
            redefinir a senha. Confira também a caixa de spam.
          </p>
          <Link href="/login" className="link-primary mt-6 inline-block">
            Voltar para o login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6 py-12">
      <div className="absolute inset-0 bg-grid-slate opacity-60 [mask-image:radial-gradient(ellipse_55%_45%_at_50%_0%,#000_60%,transparent_100%)]" />
      <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-200/50 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700"
          >
            <span aria-hidden="true">←</span> Planos de Ensino SC
          </Link>
        </div>

        <div className="card p-8">
          <h1 className="text-xl font-semibold text-slate-900">Recuperar senha</h1>
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
    </main>
  );
}
