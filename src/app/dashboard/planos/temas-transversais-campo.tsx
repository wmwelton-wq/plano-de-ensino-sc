"use client";

import { useId, useMemo, useState } from "react";
import {
  LIMITES_TEMAS,
  MACROAREAS,
  sugerirHabilidades,
  sugerirObjetos,
  temaPorId,
  temasDaEtapa,
  type ItemCurriculo,
  type TemaCatalogo,
  type TemaEscolhido,
} from "@/lib/temas-transversais";

type ListaChave = "ideias" | "objetos" | "habilidades";

interface TemasTransversaisCampoProps {
  /** Nome do campo no formulário: id do componente (Anos Iniciais) ou "plano". */
  chave: string;
  /** Componente do plano (Anos Iniciais) ou null. */
  disciplinaId: string | null;
  etapa: string;
  nomeComponente?: string;
  /** Temas já gravados para este grupo. */
  valorInicial: TemaEscolhido[];
  /** Habilidades do componente/disciplina, usadas para sugerir as que combinam com o tema. */
  habilidades: ItemCurriculo[];
  /** Objetos de conhecimento do componente/disciplina (o "contexto" ajuda a achar, mas não é gravado). */
  objetos: { objeto: string; contexto?: string | null }[];
  /** Só um campo por formulário envia o marcador que avisa o servidor para atualizar os temas. */
  comMarcador?: boolean;
}

const POR_PAGINA = 6;

/**
 * Temas transversais (opcional): o professor escolhe um tema e vê ideias dos Currículos Base e as habilidades e
 * objetos de conhecimento do próprio plano que combinam com ele. Tudo é sugestão: ele marca o que quiser usar e
 * pode escrever os seus. Sem tema escolhido, nada aparece no plano.
 */
export default function TemasTransversaisCampo({
  chave,
  disciplinaId,
  etapa,
  nomeComponente,
  valorInicial,
  habilidades,
  objetos,
  comMarcador = false,
}: TemasTransversaisCampoProps) {
  const idBase = useId();
  const [escolhidos, setEscolhidos] = useState<TemaEscolhido[]>(valorInicial);
  const disponiveis = useMemo(() => temasDaEtapa(etapa), [etapa]);
  const livres = disponiveis.filter((t) => !escolhidos.some((e) => e.tema === t.id));

  function adicionar(id: string) {
    if (!id || !temaPorId(id) || escolhidos.some((e) => e.tema === id)) return;
    setEscolhidos((atual) => [...atual, { disciplina_id: disciplinaId, tema: id, ideias: [], objetos: [], habilidades: [] }]);
  }

  function remover(id: string) {
    setEscolhidos((atual) => atual.filter((e) => e.tema !== id));
  }

  function mudarLista(id: string, lista: ListaChave, nova: string[]) {
    setEscolhidos((atual) => atual.map((e) => (e.tema === id ? { ...e, [lista]: nova } : e)));
  }

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      {comMarcador && <input type="hidden" name="tem_tct" value="1" />}
      <input type="hidden" name={`tct__${chave}`} value={JSON.stringify(escolhidos)} />

      <h3 className="field-label">Temas transversais{nomeComponente ? ` — ${nomeComponente}` : ""} (opcional)</h3>
      <p className="text-xs text-slate-500">
        Escolha um tema contemporâneo transversal para ver ideias dos Currículos Base e as habilidades e os objetos de conhecimento
        deste plano que combinam com ele. Marque o que quiser usar ou escreva os seus. Se não escolher nenhum tema, esta parte não
        aparece no plano.
      </p>

      <div className="mt-2">
        <label htmlFor={`${idBase}-tema`} className="sr-only">
          Adicionar um tema transversal
        </label>
        <select
          id={`${idBase}-tema`}
          className="input-field"
          value=""
          onChange={(e) => adicionar(e.target.value)}
          disabled={livres.length === 0}
        >
          <option value="">{livres.length === 0 ? "Todos os temas já foram adicionados" : "Adicionar um tema transversal…"}</option>
          {MACROAREAS.map((m) => {
            const dessa = livres.filter((t) => t.macroarea === m.id);
            if (dessa.length === 0) return null;
            return (
              <optgroup key={m.id} label={m.nome}>
                {dessa.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>

      {escolhidos.length > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          As sugestões são aproximadas: os cadernos dão orientações e exemplos, mas não ligam cada tema a uma habilidade específica.
          Confira antes de usar.
        </p>
      )}

      <div className="mt-3 space-y-3">
        {escolhidos.map((e) => {
          const tema = temaPorId(e.tema);
          if (!tema) return null;
          return (
            <TemaCartao
              key={e.tema}
              tema={tema}
              escolhido={e}
              habilidades={habilidades}
              objetos={objetos}
              onRemover={() => remover(e.tema)}
              onMudar={(lista, nova) => mudarLista(e.tema, lista, nova)}
            />
          );
        })}
      </div>
    </div>
  );
}

function TemaCartao({
  tema,
  escolhido,
  habilidades,
  objetos,
  onRemover,
  onMudar,
}: {
  tema: TemaCatalogo;
  escolhido: TemaEscolhido;
  habilidades: ItemCurriculo[];
  objetos: { objeto: string; contexto?: string | null }[];
  onRemover: () => void;
  onMudar: (lista: ListaChave, nova: string[]) => void;
}) {
  const macro = MACROAREAS.find((m) => m.id === tema.macroarea);
  const sugHabilidades = useMemo(() => sugerirHabilidades(tema, habilidades).map((s) => s.texto), [tema, habilidades]);
  const sugObjetos = useMemo(() => sugerirObjetos(tema, objetos).map((s) => s.texto), [tema, objetos]);
  const total = escolhido.ideias.length + escolhido.objetos.length + escolhido.habilidades.length;

  return (
    <section className="rounded-lg border border-primary-200 bg-white p-3 shadow-sm" aria-label={`Tema transversal: ${tema.nome}`}>
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{macro?.nome}</p>
          <p className="text-sm font-bold text-slate-800">{tema.nome}</p>
          <p className="text-xs text-slate-500">{tema.resumo}</p>
        </div>
        <button type="button" className="btn-secondary shrink-0" onClick={onRemover} aria-label={`Remover o tema ${tema.nome}`}>
          Remover tema
        </button>
      </div>

      <p className="mt-2 text-xs font-semibold text-slate-600" role="status">
        {total === 0
          ? "Nada marcado ainda: o tema aparece no plano só com o que você marcar ou escrever."
          : `${total} ${total === 1 ? "item será incluído" : "itens serão incluídos"} no plano.`}
      </p>

      <ListaSugestoes
        titulo="Ideias de abordagem (inspiradas nos cadernos)"
        vazio=""
        sugestoes={tema.ideias}
        selecionados={escolhido.ideias}
        onMudar={(nova) => onMudar("ideias", nova)}
        rotuloProprio="Escrever a minha ideia"
      />
      <ListaSugestoes
        titulo="Objetos de conhecimento relacionados"
        vazio="Nenhum objeto de conhecimento deste plano combina com o tema; se quiser, escreva o seu abaixo."
        sugestoes={sugObjetos}
        selecionados={escolhido.objetos}
        onMudar={(nova) => onMudar("objetos", nova)}
        rotuloProprio="Escrever o meu objeto de conhecimento"
      />
      <ListaSugestoes
        titulo="Habilidades relacionadas"
        vazio="Nenhuma habilidade deste plano combina com o tema; se quiser, escreva a sua abaixo."
        sugestoes={sugHabilidades}
        selecionados={escolhido.habilidades}
        onMudar={(nova) => onMudar("habilidades", nova)}
        rotuloProprio="Escrever a minha habilidade"
      />
    </section>
  );
}

function ListaSugestoes({
  titulo,
  vazio,
  sugestoes,
  selecionados,
  onMudar,
  rotuloProprio,
}: {
  titulo: string;
  vazio: string;
  sugestoes: string[];
  selecionados: string[];
  onMudar: (nova: string[]) => void;
  rotuloProprio: string;
}) {
  const id = useId();
  const [visiveis, setVisiveis] = useState(POR_PAGINA);
  const [texto, setTexto] = useState("");

  // As escritas pelo professor (que não estão nas sugestões) ficam sempre à mostra, no começo da lista.
  const proprios = selecionados.filter((s) => !sugestoes.includes(s));
  const lista = [...proprios, ...sugestoes];
  const mostradas = lista.slice(0, Math.max(visiveis, proprios.length));
  const escondidas = lista.length - mostradas.length;
  const cheio = selecionados.length >= LIMITES_TEMAS.itensPorLista;

  function alternar(item: string, marcado: boolean) {
    if (marcado) {
      if (!selecionados.includes(item) && !cheio) onMudar([...selecionados, item]);
    } else {
      onMudar(selecionados.filter((s) => s !== item));
    }
  }

  function adicionarProprio() {
    const limpo = texto.replace(/\s+/g, " ").trim();
    if (!limpo || cheio) return;
    if (!selecionados.some((s) => s.toLowerCase() === limpo.toLowerCase())) onMudar([...selecionados, limpo]);
    setTexto("");
  }

  return (
    <div className="mt-3">
      <p className="text-sm font-bold text-slate-800">{titulo}</p>
      {lista.length === 0 && vazio && <p className="text-xs text-slate-500">{vazio}</p>}
      {mostradas.length > 0 && (
        <ul className="mt-1 space-y-1">
          {mostradas.map((item, i) => {
            const marcado = selecionados.includes(item);
            return (
              <li key={item}>
                <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={(ev) => alternar(item, ev.target.checked)}
                    disabled={!marcado && cheio}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary-600"
                    aria-describedby={i < proprios.length ? `${id}-proprio` : undefined}
                  />
                  <span className="min-w-0 break-words">
                    {item}
                    {i < proprios.length && <em id={`${id}-proprio`} className="ml-1 text-xs text-slate-500">(escrito por você)</em>}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      {escondidas > 0 && (
        <button type="button" className="mt-1 text-xs font-semibold text-primary-700 underline" onClick={() => setVisiveis((v) => v + POR_PAGINA * 2)}>
          Ver mais {escondidas > POR_PAGINA * 2 ? `(${escondidas} restantes)` : `(${escondidas})`}
        </button>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label htmlFor={`${id}-proprio-campo`} className="sr-only">
          {rotuloProprio}
        </label>
        <input
          id={`${id}-proprio-campo`}
          type="text"
          className="input-field min-w-0 flex-1"
          maxLength={LIMITES_TEMAS.caracteresPorItem}
          value={texto}
          placeholder={`${rotuloProprio}…`}
          autoComplete="off"
          disabled={cheio}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            // Enter não pode enviar o formulário do plano: aqui ele só adiciona o item.
            if (e.key === "Enter") {
              e.preventDefault();
              adicionarProprio();
            }
          }}
        />
        <button type="button" className="btn-secondary shrink-0" onClick={adicionarProprio} disabled={!texto.trim() || cheio}>
          Adicionar
        </button>
      </div>
      {cheio && <p className="mt-1 text-xs text-amber-700">Você chegou ao limite de itens desta lista.</p>}
    </div>
  );
}
