"use client";

import { useId, useMemo, useState } from "react";
import type { HabilidadeCurricular, HabilidadeManual } from "@/lib/database.types";

interface HabilidadePickerProps {
  descricaoAjuda?: string;
  habilidades: HabilidadeCurricular[];
  selecionadasIniciais: string[];
  vazio: string;
  /** Texto do botão azul que abre a lista (ex.: "Clique para adicionar habilidades"). */
  rotuloBotao?: string;
  /** Mostra o botão "Adicionar manualmente" (habilidade que não está na lista). */
  permitirManual?: boolean;
  manuaisIniciais?: HabilidadeManual[];
}

/**
 * Seletor de habilidades: um botão azul abre a lista (com busca); as
 * habilidades escolhidas ficam sempre visíveis logo abaixo, para o professor
 * conferir o que já entrou no plano. Opcionalmente aceita habilidades
 * digitadas à mão (enviadas em "habilidade_manual_codigo/descricao").
 */
export default function HabilidadePicker({
  descricaoAjuda,
  habilidades,
  selecionadasIniciais,
  vazio,
  rotuloBotao = "Clique para adicionar habilidades",
  permitirManual = false,
  manuaisIniciais = [],
}: HabilidadePickerProps) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const buscaId = useId();
  const porId = useMemo(() => new Map(habilidades.map((h) => [h.id, h])), [habilidades]);
  // Só guardamos as seleções que pertencem a esta lista.
  const [selecionadas, setSelecionadas] = useState<Set<string>>(
    () => new Set(selecionadasIniciais.filter((id) => porId.has(id)))
  );

  const [manuais, setManuais] = useState<HabilidadeManual[]>(manuaisIniciais);
  const [formManualAberto, setFormManualAberto] = useState(false);
  const [codigoManual, setCodigoManual] = useState("");
  const [descricaoManual, setDescricaoManual] = useState("");

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return habilidades;
    return habilidades.filter(
      (h) => h.codigo?.toLowerCase().includes(termo) || h.descricao.toLowerCase().includes(termo)
    );
  }, [busca, habilidades]);

  function alternar(id: string) {
    setSelecionadas((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function incluirManual() {
    const descricao = descricaoManual.trim();
    if (!descricao) return;
    setManuais((atual) => [...atual, { codigo: codigoManual.trim() || null, descricao }]);
    setCodigoManual("");
    setDescricaoManual("");
    setFormManualAberto(false);
  }

  const escolhidas = Array.from(selecionadas)
    .map((id) => porId.get(id))
    .filter((h): h is HabilidadeCurricular => Boolean(h));
  const total = escolhidas.length + manuais.length;

  return (
    <div className="space-y-3">
      {/* As escolhas seguem para o formulário por estes campos ocultos (a lista pode estar fechada). */}
      {escolhidas.map((h) => (
        <input key={h.id} type="hidden" name="habilidade_ids" value={h.id} />
      ))}
      {manuais.map((m, i) => (
        <span key={`manual-${i}`}>
          <input type="hidden" name="habilidade_manual_codigo" value={m.codigo ?? ""} />
          <input type="hidden" name="habilidade_manual_descricao" value={m.descricao} />
        </span>
      ))}

      {descricaoAjuda && <p className="text-xs text-slate-500">{descricaoAjuda}</p>}

      {habilidades.length === 0 ? (
        <p className="rounded-xl border border-dashed border-primary-200 bg-white px-3 py-4 text-sm text-slate-500">
          {vazio}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-expanded={aberto}
            onClick={() => setAberto((a) => !a)}
            className="btn-azul"
          >
            <span aria-hidden="true">{aberto ? "▲" : "＋"}</span>
            {aberto ? "Fechar lista de habilidades" : rotuloBotao}
          </button>
          {permitirManual && (
            <button
              type="button"
              aria-expanded={formManualAberto}
              onClick={() => setFormManualAberto((a) => !a)}
              className="btn-azul-suave"
            >
              <span aria-hidden="true">✎</span> Adicionar manualmente
            </button>
          )}
        </div>
      )}

      {habilidades.length === 0 && permitirManual && (
        <button
          type="button"
          aria-expanded={formManualAberto}
          onClick={() => setFormManualAberto((a) => !a)}
          className="btn-azul-suave"
        >
          <span aria-hidden="true">✎</span> Adicionar manualmente
        </button>
      )}

      {formManualAberto && (
        <div className="space-y-3 rounded-xl border border-primary-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">Habilidade fora da lista</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr]">
            <div>
              <label htmlFor={`${buscaId}-cod`} className="field-label">
                Código <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                id={`${buscaId}-cod`}
                type="text"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                placeholder="Ex.: EF07CO01"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor={`${buscaId}-desc`} className="field-label">
                Descrição da habilidade
              </label>
              <textarea
                id={`${buscaId}-desc`}
                rows={2}
                value={descricaoManual}
                onChange={(e) => setDescricaoManual(e.target.value)}
                placeholder="Escreva a habilidade que você quer trabalhar"
                className="input-field"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={incluirManual}
              disabled={descricaoManual.trim().length === 0}
              className="btn-azul !py-2"
            >
              Incluir no plano
            </button>
            <button type="button" onClick={() => setFormManualAberto(false)} className="btn-secondary !rounded-xl">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {aberto && habilidades.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-primary-200 bg-white shadow-sm">
          <label htmlFor={buscaId} className="sr-only">
            Buscar habilidade por código ou palavra-chave
          </label>
          <input
            id={buscaId}
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por código ou palavra-chave..."
            className="w-full border-b border-primary-100 bg-primary-50/40 px-3 py-2.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary-500"
          />
          <div className="max-h-64 overflow-y-auto p-2">
            {filtradas.length === 0 && (
              <p className="px-2 py-2 text-sm text-slate-400">Nenhuma habilidade encontrada para essa busca.</p>
            )}
            {filtradas.map((h) => (
              <label
                key={h.id}
                className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-sm hover:bg-primary-50/60"
              >
                <input
                  type="checkbox"
                  checked={selecionadas.has(h.id)}
                  onChange={() => alternar(h.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span>
                  {h.codigo && <span className="font-medium text-slate-900">({h.codigo}) </span>}
                  <span className="text-slate-600">{h.descricao}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-primary-100 bg-white">
        <p className="border-b border-primary-100 px-3 py-2 text-sm font-bold text-slate-800">
          Habilidades no plano <span className="font-normal text-slate-400">({total})</span>
        </p>
        {total === 0 ? (
          <p className="px-3 py-2.5 text-sm text-slate-400">
            Nenhuma habilidade escolhida ainda.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {escolhidas.map((h) => (
              <li key={h.id} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                <span className="text-slate-600">
                  {h.codigo && <span className="font-medium text-slate-900">({h.codigo}) </span>}
                  {h.descricao}
                </span>
                <button type="button" onClick={() => alternar(h.id)} className="btn-text-danger shrink-0">
                  Remover
                </button>
              </li>
            ))}
            {manuais.map((m, i) => (
              <li key={`m-${i}`} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                <span className="text-slate-600">
                  {m.codigo && <span className="font-medium text-slate-900">({m.codigo}) </span>}
                  {m.descricao}{" "}
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
                    manual
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setManuais((atual) => atual.filter((_, j) => j !== i))}
                  className="btn-text-danger shrink-0"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
