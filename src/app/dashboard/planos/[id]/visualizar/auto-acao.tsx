"use client";

import { useEffect, useRef, useState } from "react";
import { gerarPdfDoElemento } from "@/lib/gerar-pdf";

interface AutoAcaoProps {
  acao?: string;
  titulo: string;
}

/**
 * Ao ser montado, executa automaticamente a ação de imprimir, salvar no
 * dispositivo ou compartilhar o plano — de acordo com o parâmetro `auto`
 * vindo do link clicado logo abaixo do botão "Salvar" na edição do plano.
 * Assim o professor tem a ação em um clique só, sem precisar procurar o
 * botão certo nesta página.
 */
export default function AutoAcao({ acao, titulo }: AutoAcaoProps) {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const executado = useRef(false);

  useEffect(() => {
    if (!acao || executado.current) return;
    executado.current = true;

    async function executar() {
      try {
        if (acao === "imprimir") {
          window.print();
          return;
        }

        if (acao === "salvar") {
          setMensagem("Gerando PDF...");
          const arquivo = await gerarPdfDoElemento("plano-conteudo", titulo);
          const url = URL.createObjectURL(arquivo);
          const a = document.createElement("a");
          a.href = url;
          a.download = arquivo.name;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          setMensagem("PDF salvo no dispositivo.");
          return;
        }

        if (acao === "compartilhar") {
          setMensagem("Gerando PDF...");
          const arquivo = await gerarPdfDoElemento("plano-conteudo", titulo);

          if (
            typeof navigator !== "undefined" &&
            "share" in navigator &&
            navigator.canShare?.({ files: [arquivo] })
          ) {
            try {
              await navigator.share({
                files: [arquivo],
                title: titulo,
              });
              setMensagem(null);
              return;
            } catch {
              // usuário cancelou o compartilhamento ou o navegador falhou —
              // cai para o download abaixo.
            }
          }

          const url = URL.createObjectURL(arquivo);
          const a = document.createElement("a");
          a.href = url;
          a.download = arquivo.name;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          setMensagem(
            "Este navegador não permite compartilhar arquivos diretamente. O PDF foi baixado — anexe-o no aplicativo que deseja usar para compartilhar."
          );
          return;
        }
      } catch (erro) {
        console.error(erro);
        setMensagem("Não foi possível concluir a ação. Tente novamente.");
      }
    }

    executar();
  }, [acao, titulo]);

  if (!mensagem) return null;

  return (
    <div className="mx-auto mb-4 max-w-[297mm] px-4 print:hidden">
      <p
        role="status"
        className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-700 shadow-sm"
      >
        {mensagem}
      </p>
    </div>
  );
}
