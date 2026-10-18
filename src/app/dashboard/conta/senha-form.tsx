"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import RegrasSenha from "@/components/regras-senha";

export default function SenhaForm() {
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMensagem(null);
    if (senha.length < 8) {
      setMensagem({ tipo: "erro", texto: "A senha precisa ter pelo menos 8 caracteres." });
      return;
    }
    if (senha !== confirmar) {
      setMensagem({ tipo: "erro", texto: "As duas senhas não são iguais." });
      return;
    }
    setSalvando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) {
      const texto = /same|different/i.test(error.message)
        ? "Escolha uma senha diferente da atual."
        : /reauth|recent|nonce/i.test(error.message)
          ? "Por segurança, saia da conta, entre de novo e tente outra vez."
          : /weak|pwned|leaked|easy/i.test(error.message)
            ? "Essa senha é fácil de adivinhar. Escolha uma mais forte."
            : "Não foi possível trocar a senha agora. Tente de novo em instantes.";
      setMensagem({ tipo: "erro", texto });
      return;
    }
    setSenha("");
    setConfirmar("");
    setMensagem({ tipo: "ok", texto: "Senha alterada com sucesso." });
  }

  return (
    <form onSubmit={salvar} className="mt-5 space-y-4">
      <div>
        <label htmlFor="conta-senha" className="field-label">
          Nova senha
        </label>
        <input
          id="conta-senha"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="input-field"
        />
        <RegrasSenha senha={senha} />
      </div>
      <div>
        <label htmlFor="conta-senha2" className="field-label">
          Repita a nova senha
        </label>
        <input
          id="conta-senha2"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          className="input-field"
        />
      </div>
      {mensagem && (
        <p
          role={mensagem.tipo === "erro" ? "alert" : "status"}
          className={`rounded-xl border px-3 py-2 text-sm ${
            mensagem.tipo === "erro" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {mensagem.texto}
        </p>
      )}
      <button type="submit" disabled={salvando} className="btn-primary">
        {salvando ? "Salvando..." : "Alterar senha"}
      </button>
    </form>
  );
}
