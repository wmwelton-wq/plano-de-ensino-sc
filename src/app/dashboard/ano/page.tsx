import { anosParaEscolha, destinoSeguro } from "@/lib/ano-competencia";
import { anoCompetencia } from "@/lib/ano-competencia-servidor";
import { escolherAnoCompetencia } from "./actions";

export const metadata = { title: "Plano Docente — Ano de competência" };

export default async function EscolherAnoPage({ searchParams }: { searchParams: Promise<{ proximo?: string }> }) {
  const { proximo } = await searchParams;
  const atual = (await anoCompetencia()) ?? new Date().getFullYear();
  const anos = anosParaEscolha();

  return (
    <div className="mx-auto max-w-md py-6">
      <form action={escolherAnoCompetencia} className="painel-cartao space-y-5 p-6 sm:p-8">
        <input type="hidden" name="proximo" value={destinoSeguro(proximo)} />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Qual é o ano de competência?</h1>
          <p className="mt-2 text-sm text-slate-600">
            Escolha o ano em que você vai trabalhar. Planos, calendário e listas ficam separados por ano: o que você fizer em um ano não se mistura com os outros.
          </p>
        </div>
        <div>
          <label htmlFor="ano" className="field-label">
            Ano de competência
          </label>
          <select id="ano" name="ano" defaultValue={String(anos.includes(atual) ? atual : new Date().getFullYear())} className="input-field">
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">Você pode trocar de ano a qualquer momento pelo botão &quot;Ano&quot; no topo da página.</p>
        </div>
        <button type="submit" className="btn-azul w-full justify-center">
          Continuar
        </button>
      </form>
    </div>
  );
}
