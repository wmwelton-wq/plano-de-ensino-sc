"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CadastroPage() {
  const supabase = createClient();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      setCarregando(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
      },
    });

    setCarregando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setSucesso(true);
  }

  if (sucesso) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Verifique seu email</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enviamos um link de confirmação para <strong>{email}</strong>. Clique
            nele para ativar sua conta e depois faça login.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block font-medium text-primary-600 hover:underline"
          >
            Voltar para o login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Criar conta</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cadastre-se para começar a criar seus planos de ensino.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-slate-700">
              Nome completo
            </label>
            <input
              id="nome"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-slate-700">
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-slate-400">Mínimo de 8 caracteres.</p>
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {carregando ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
