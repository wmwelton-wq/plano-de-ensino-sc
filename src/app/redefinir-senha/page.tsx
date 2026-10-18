"use client";

import { Icone } from "@/components/icones";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthTopo from "@/components/auth-topo";
import { createClient } from "@/lib/supabase/client";

/**
 * Página final do fluxo de recuperação de senha. Só funciona para quem
 * chegou aqui através do link de email (que passa por /auth/confirm e
 * cria uma sessão temporária de recuperação) — sem essa sessão, ninguém
 * consegue trocar a senha de ninguém, nem a própria sem o link válido.
 */
export default function RedefinirSenhaPage() {
  const router = useRouter();
  const supabase = createClient();

  const [verificando, setVerificando] = useState(true);
  const [sessaoValida, setSessaoValida] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSessaoValida(Boolean(data.user));
      setVerificando(false);
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);

    if (error) {
      setErro("Não foi possível redefinir a senha. Solicite um novo link.");
      return;
    }

    setSucesso(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  if (verificando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <p className="text-sm text-slate-500">Verificando link...</p>
      </main>
    );
  }

  if (!sessaoValida) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden fundo-auth px-6 py-12">
        <div className="card relative w-full max-w-sm p-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Link inválido ou expirado</h1>
          <p className="mt-2 text-sm text-slate-600">
            Por segurança, o link de redefinição de senha só funciona uma vez e expira depois de
            um tempo. Solicite um novo.
          </p>
          <Link href="/recuperar-senha" className="link-primary mt-6 inline-block">
            Recuperar senha
          </Link>
        </div>
      </main>
    );
  }

  if (sucesso) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden fundo-auth px-6 py-12">
        <div className="card relative w-full max-w-sm p-8 text-center">
          <div data-tom="verde" className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg [background:var(--tom-claro)] [color:var(--tom)]">
            <Icone nome="check" className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Senha redefinida!</h1>
          <p className="mt-2 text-sm text-slate-600">Encaminhando você para seus planos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden fundo-auth px-6 py-12">

      <div className="relative w-full max-w-sm">
      <AuthTopo voltarHref="/login" voltarRotulo="Voltar para o login" />
      <div className="card relative w-full p-8">
        <h1 className="text-xl font-semibold text-slate-900">Nova senha</h1>
        <p className="mt-1 text-sm text-slate-500">Escolha uma nova senha para sua conta.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="senha" className="field-label">
              Nova senha
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
            <p className="field-hint">Mínimo de 8 caracteres.</p>
          </div>

          <div>
            <label htmlFor="confirmarSenha" className="field-label">
              Confirmar nova senha
            </label>
            <input
              id="confirmarSenha"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="input-field"
            />
          </div>

          {erro && (
            <p role="alert" className="text-sm text-red-600">
              {erro}
            </p>
          )}

          <button type="submit" disabled={carregando} className="btn-primary w-full">
            {carregando ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </div>
      </div>
    </main>
  );
}
