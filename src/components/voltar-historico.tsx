"use client";

import { useRouter } from "next/navigation";
import { Icone } from "@/components/icones";

/**
 * "Voltar" para páginas que podem ser abertas de vários lugares (Termos de Uso, Aviso de Privacidade):
 * volta para onde a pessoa estava; se a página foi aberta direto (sem histórico), vai para o endereço de reserva.
 */
export default function VoltarHistorico({ reserva = "/", rotulo = "Voltar" }: { reserva?: string; rotulo?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn-voltar"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push(reserva);
      }}
    >
      <Icone nome="setaEsquerda" className="h-4 w-4" espessura={2.2} />
      {rotulo}
    </button>
  );
}
