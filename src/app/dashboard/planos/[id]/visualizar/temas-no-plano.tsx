import { temaPorId, temaTemConteudo, type TemaEscolhido } from "@/lib/temas-transversais";

/**
 * Temas transversais no plano impresso. Quem chama só passa temas que o professor escolheu; um tema sem nenhum item
 * marcado ou escrito não aparece (nunca sai uma caixa vazia).
 */
export function temasParaImprimir(temas: TemaEscolhido[]): TemaEscolhido[] {
  return temas.filter(temaTemConteudo);
}

function Lista({ titulo, itens }: { titulo: string; itens: string[] }) {
  if (itens.length === 0) return null;
  return (
    <div className="mt-1">
      <p className="font-semibold">{titulo}</p>
      <ul className="list-disc pl-5">
        {itens.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function TemasNoPlano({ temas }: { temas: TemaEscolhido[] }) {
  const lista = temasParaImprimir(temas);
  if (lista.length === 0) return null;
  return (
    <div className="space-y-2">
      {lista.map((t) => {
        const tema = temaPorId(t.tema);
        if (!tema) return null;
        return (
          <div key={t.tema}>
            <p className="font-bold">{tema.nome}</p>
            <Lista titulo="Ideias de abordagem:" itens={t.ideias} />
            <Lista titulo="Objetos de conhecimento:" itens={t.objetos} />
            <Lista titulo="Habilidades:" itens={t.habilidades} />
          </div>
        );
      })}
    </div>
  );
}
