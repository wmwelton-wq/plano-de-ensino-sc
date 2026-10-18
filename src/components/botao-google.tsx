"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  rotulo?: string;
  desabilitado?: boolean;
  /** Mensagem mostrada quando o botão está desabilitado e a pessoa tenta usar (ex.: falta aceitar os termos). */
  motivoDesabilitado?: string;
}

function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

/** "Entrar com Google": um clique, sem senha para lembrar. O retorno passa por /auth/callback. */
export default function BotaoGoogle({ rotulo = "Continuar com Google", desabilitado = false, motivoDesabilitado }: Props) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar() {
    if (desabilitado) {
      setErro(motivoDesabilitado ?? null);
      return;
    }
    setErro(null);
    setCarregando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: "select_account" } },
    });
    if (error) {
      setCarregando(false);
      setErro("Não foi possível entrar com o Google agora. Tente novamente ou use seu e-mail e senha.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={entrar}
        disabled={carregando}
        aria-disabled={desabilitado}
        className={`flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
          desabilitado ? "opacity-60" : ""
        }`}
      >
        <LogoGoogle />
        {carregando ? "Abrindo o Google..." : rotulo}
      </button>
      {erro && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
