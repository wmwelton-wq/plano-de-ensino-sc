"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NomeForm({ nomeInicial, email }: { nomeInicial: string; email: string }) {
  const router = useRouter();
  const [nome, setNome] = useState(nomeInicial);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMensagem(null);
    const limpo = nome.trim().replace(/\s+/g, " ");
    if (limpo.length < 2) {
      setMensagem({ tipo: "erro", texto: "Escreva seu nome completo." });
      return;
    }
    if (limpo.length > 120) {
      setMensagem({ tipo: "erro", texto: "O nome está muito longo (máximo de 120 letras)." });
      return;
    }
    setSalvando(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSalvando(false);
      setMensagem({ tipo: "erro", texto: "Sua sessão terminou. Entre novamente." });
      return;
    }
    const { error } = await supabase.from("professores").update({ nome: limpo }).eq("id", user.id);
    setSalvando(false);
    if (error) {
      setMensagem({ tipo: "erro", texto: "Não foi possível salvar agora. Tente de novo em instantes." });
      return;
    }
    setNome(limpo);
    setMensagem({ tipo: "ok", texto: "Nome atualizado." });
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="mt-5 space-y-4">
      <div>
        <label htmlFor="conta-nome" className="field-label">
          Nome completo
        </label>
        <input
          id="conta-nome"
          type="text"
          required
          autoComplete="name"
          maxLength={120}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="input-field"
        />
        <p className="field-hint">Este nome aparece no topo da tela e nos planos em que o campo “professor” é preenchido automaticamente.</p>
      </div>
      <div>
        <label htmlFor="conta-email" className="field-label">
          E-mail de acesso
        </label>
        <input id="conta-email" type="email" value={email} readOnly disabled className="input-field cursor-not-allowed bg-slate-50 text-slate-500" />
        <p className="field-hint">Para trocar o e-mail, fale com contato@planodocente.com.br.</p>
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
      <button type="submit" disabled={salvando || nome.trim() === nomeInicial.trim()} className="btn-primary">
        {salvando ? "Salvando..." : "Salvar nome"}
      </button>
    </form>
  );
}
