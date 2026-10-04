"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Turnstile from "@/components/turnstile";
import { verificarTurnstile } from "@/lib/turnstile-client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro("Email ou senha incorretos.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
          <h1 className="text-xl font-semibold text-slate-900">Entrar</h1>
          <p className="mt-1 text-sm text-slate-500">Acesse sua conta de professor.</p>

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

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="senha" className="field-label">
                  Senha
                </label>
                <Link href="/recuperar-senha" className="link-primary text-xs">
                  Esqueci minha senha
                </Link>
              </div>
              <input
                id="senha"
                type="password"
                required
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
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
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Ainda não tem conta? <Link href="/cadastro" className="link-primary">Cadastre-se</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
