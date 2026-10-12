"use client";

import { useRouter } from "next/navigation";

interface AcoesRapidasProps {
  planoId: string;
}

/**
 * Ações rápidas logo abaixo do botão "Salvar alterações", para o
 * professor salvar no dispositivo, imprimir ou compartilhar o plano
 * assim que terminar de editar — sem precisar procurar essas opções
 * em outro lugar.
 *
 * São <button>, não <Link>: cada uma dispara uma ação do navegador
 * (diálogo de impressão, download de arquivo ou menu de compartilhamento
 * nativo) em vez de navegar para uma página nova — usar um link aqui
 * anunciaria "link" para quem navega por teclado/leitor de tela, dando a
 * entender que o clique leva a outro conteúdo, o que não é o caso.
 */
export default function AcoesRapidas({ planoId }: AcoesRapidasProps) {
  const router = useRouter();
  const base = `/dashboard/planos/${planoId}/visualizar`;

  return (
    <div className="mt-4 rounded-2xl border border-primary-100 bg-primary-50/60 p-4">
      <p className="mb-3 text-sm font-semibold text-primary-800">
        Depois de salvar, use os atalhos abaixo:
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => router.push(`${base}?auto=salvar`)}
          aria-label="Baixar este plano de ensino como PDF para este dispositivo"
          className="btn-azul"
        >
          Baixar PDF
        </button>
        <button
          type="button"
          onClick={() => router.push(`${base}?auto=word`)}
          aria-label="Baixar este plano de ensino como documento do Word"
          className="btn-azul"
        >
          Baixar Word
        </button>
        <button
          type="button"
          onClick={() => router.push(`${base}?auto=imprimir`)}
          aria-label="Abrir a caixa de impressão do navegador com este plano de ensino"
          className="btn-azul-suave"
        >
          Imprimir
        </button>
        <button
          type="button"
          onClick={() => router.push(`${base}?auto=compartilhar`)}
          aria-label="Compartilhar o PDF deste plano de ensino, ou baixá-lo se o navegador não tiver essa opção"
          className="btn-azul-suave"
        >
          Compartilhar
        </button>
      </div>
    </div>
  );
}
