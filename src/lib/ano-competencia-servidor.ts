import { cookies } from "next/headers";
import { COOKIE_ANO, lerAno } from "@/lib/ano-competencia";

/** Ano de competência escolhido nesta sessão (null se ainda não escolheu). */
export async function anoCompetencia(): Promise<number | null> {
  return lerAno((await cookies()).get(COOKIE_ANO)?.value);
}

/** Ano escolhido ou, se por algum motivo não houver, o ano atual (o proxy já leva quem não escolheu à tela de escolha). */
export async function anoCompetenciaOuAtual(): Promise<number> {
  return (await anoCompetencia()) ?? new Date().getFullYear();
}
