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
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-sm font-medium text-slate-700">
        Depois de salvar, use os atalhos abaixo:
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => router.push(`${base}?auto=salvar`)}
          aria-label="Baixar este plano de ensino como PDF para este dispositivo"
          className="btn-primary"
        >
          Salvar no dispositivo
        </button>
        <button
          type="button"
          onClick={() => router.push(`${base}?auto=imprimir`)}
          aria-label="Abrir a caixa de impressão do navegador com este plano de ensino"
          className="btn-secondary"
        >
          Imprimir
        </button>
        <button
          type="button"
          onClick={() => router.push(`${base}?auto=compartilhar`)}
          aria-label="Compartilhar o PDF deste plano de ensino, ou baixá-lo se o navegador não tiver essa opção"
          className="btn-secondary"
        >
          Compartilhar
        </button>
      </div>
    </div>
  );
}
