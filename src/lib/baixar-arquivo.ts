import { CHAVE_BAIXOU } from "@/lib/primeiros-passos";

/** Dispara o download de um File gerado no navegador. */
export function baixarArquivo(arquivo: File) {
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement("a");
  a.href = url;
  a.download = arquivo.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  try {
    window.localStorage.setItem(CHAVE_BAIXOU, "1"); // marca "Baixe o PDF" nos primeiros passos do painel
  } catch {
    /* sem armazenamento: só não marca o passo */
  }
}
