/** Traduz as mensagens de erro do Supabase Auth (em inglês) para português claro. */
export function traduzirErroAuth(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("user_already_exists"))
    return "Este e-mail já tem cadastro. Tente entrar ou use “Esqueci minha senha”.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes"))
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.";
  if (m.includes("weak") || m.includes("pwned") || m.includes("leaked") || m.includes("easy to guess"))
    return "Essa senha é fácil de adivinhar ou já apareceu em vazamentos. Escolha outra, mais forte.";
  if (m.includes("at least") && m.includes("character")) return "A senha é curta demais. Use pelo menos 8 caracteres.";
  if (m.includes("invalid") && m.includes("email")) return "Esse e-mail não parece válido. Confira se digitou certo.";
  if (m.includes("sending") && m.includes("email")) return "Não conseguimos enviar o e-mail agora. Tente de novo em instantes.";
  if (m.includes("network") || m.includes("fetch")) return "Sem conexão com o servidor. Confira sua internet e tente de novo.";
  return mensagem;
}
