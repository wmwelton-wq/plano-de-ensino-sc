"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      aria-label="Abrir a caixa de impressão do navegador para imprimir ou salvar este plano como PDF"
      className="btn-primary print:hidden"
    >
      Imprimir / Salvar como PDF
    </button>
  );
}
