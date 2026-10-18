"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/auth-layout";
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
    <AuthLayout
      voltarHref="/"
      voltarRotulo="Voltar ao site"
      ilustracao="login"
      titulo="Que bom ter você de volta!"
      texto="Entre para continuar seus planos de ensino de onde parou."
      topicos={["Planos anuais e mensais no formato exigido pelo Estado", "Baixe em PDF ou Word, ou imprima", "Seus planos ficam guardados na sua conta"]}
    >
      <div>
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Entrar</h1>
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

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link href="/termos-de-uso" className="link-primary text-xs">
            Termos de Uso
          </Link>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <Link href="/privacidade" className="link-primary text-xs">
            Aviso de Privacidade
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
