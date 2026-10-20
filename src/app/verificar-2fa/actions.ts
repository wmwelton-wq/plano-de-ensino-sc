"use server";

import {
  concluirLoginChave,
  concluirRegistroChave,
  confirmarCodigoEmail,
  desativarEmail,
  enviarCodigoEmail,
  opcoesLoginChave,
  opcoesRegistroChave,
  removerChave,
  resumoSegundaEtapa,
} from "@/lib/segundo-fator";

// Estas ações são só a porta de entrada: toda a conferência (quem pede, limites, validade) está em "@/lib/segundo-fator".

export async function acaoEnviarCodigo(modo: "login" | "ativar") {
  return enviarCodigoEmail(modo === "ativar" ? "ativar" : "login");
}
export async function acaoConfirmarCodigo(codigo: string, modo: "login" | "ativar") {
  return confirmarCodigoEmail(String(codigo ?? ""), modo === "ativar" ? "ativar" : "login");
}
export async function acaoDesativarEmail() {
  return desativarEmail();
}
export async function acaoOpcoesRegistroChave() {
  return opcoesRegistroChave();
}
export async function acaoConcluirRegistroChave(resposta: { clientDataJSON: string; attestationObject: string }, nome: string) {
  return concluirRegistroChave({ clientDataJSON: String(resposta?.clientDataJSON ?? ""), attestationObject: String(resposta?.attestationObject ?? "") }, String(nome ?? ""));
}
export async function acaoOpcoesLoginChave() {
  return opcoesLoginChave();
}
export async function acaoConcluirLoginChave(resposta: { id: string; clientDataJSON: string; authenticatorData: string; assinatura: string }) {
  return concluirLoginChave({
    id: String(resposta?.id ?? ""),
    clientDataJSON: String(resposta?.clientDataJSON ?? ""),
    authenticatorData: String(resposta?.authenticatorData ?? ""),
    assinatura: String(resposta?.assinatura ?? ""),
  });
}
export async function acaoRemoverChave(id: string) {
  return removerChave(String(id ?? ""));
}
export async function acaoResumoSegundaEtapa() {
  return resumoSegundaEtapa();
}
