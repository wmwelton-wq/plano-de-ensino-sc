"use client";

import { useRouter } from "next/navigation";
import { CHAVE_TUTORIAL } from "../tutorial-inicial";

export default function ReiniciarTutorial() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn-azul-suave"
      onClick={() => {
        try {
          window.localStorage.removeItem(CHAVE_TUTORIAL);
        } catch {
          /* sem armazenamento: o tutorial abre mesmo assim */
        }
        router.push("/dashboard?tutorial=1");
      }}
    >
      Rever o tutorial
    </button>
  );
}
