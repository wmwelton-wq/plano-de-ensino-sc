"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import type { EtapaPlano } from "@/lib/database.types";
import { montarTurma, tituloParaTurma } from "@/lib/copiar-turma";
import type { EstadoFormulario } from "../../actions";
import SecaoPlano from "../../secao-plano";
import BarraSalvar from "../../barra-salvar";
import { SERIES_POR_ETAPA, separarTurma } from "../../turma-selector";

interface EscolaOpcao {
  id: string;
  nome: string;
  municipio: string;
}

interface Props {
  planoId: string;
  etapa: EtapaPlano;
  tituloOrigem: string;
  turmaOrigem: string | null;
  dataInicioOrigem: string | null;
  dataFimOrigem: string | null;
  quantidadeAulasOrigem: number | null;
  escolaOrigemId: string | null;
  escolas: EscolaOpcao[];
  action: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
}

interface Linha {
  chave: number;
  serie: string;
  ident: string;
}

/**
 * Copiar para outras turmas: por padrão fica na mesma escola e no mesmo ano/série (só muda a letra ou o número da
 * turma). Quem quiser copiar para outro ano/série marca a opção e escolhe a série de cada cópia.
 */
export default function ReplicarTurmasForm({
  planoId,
  etapa,
  tituloOrigem,
  turmaOrigem,
  dataInicioOrigem,
  dataFimOrigem,
  quantidadeAulasOrigem,
  escolaOrigemId,
  escolas,
  action,
}: Props) {
  const [estado, formAction, pendente] = useActionState(action, {});
  const origem = useMemo(() => separarTurma(etapa, turmaOrigem), [etapa, turmaOrigem]);
  // Série não reconhecida (ou plano sem turma): o professor escreve o nome inteiro da turma.
  const serieConhecida = origem.serie !== "" && origem.serie !== "__outra__";
  const [outraSerie, setOutraSerie] = useState(false);
  const [proxima, setProxima] = useState(2);
  const [linhas, setLinhas] = useState<Linha[]>([{ chave: 1, serie: serieConhecida ? origem.serie : "", ident: "" }]);
  const [escolaId, setEscolaId] = useState(escolaOrigemId ?? "");

  const series = SERIES_POR_ETAPA[etapa];

  function turmaDa(l: Linha): string {
    if (!serieConhecida) return l.ident.trim();
    return montarTurma(outraSerie ? l.serie : origem.serie, l.ident);
  }

  function mudar(chave: number, parte: Partial<Linha>) {
    setLinhas((atual) => atual.map((l) => (l.chave === chave ? { ...l, ...parte } : l)));
  }

  const destinos = linhas.map(turmaDa).filter(Boolean);

  return (
    <form action={formAction} className="space-y-6">
      <SecaoPlano
        id="copiar-1"
        numero={1}
        titulo="Para quais turmas?"
        descricao={
          serieConhecida
            ? `Plano de origem: ${turmaOrigem}. As cópias ficam no mesmo ano/série — escreva só a letra ou o número da turma.`
            : "Escreva o nome de cada turma que vai receber uma cópia do plano."
        }
        tom="verde"
      >
        <div className="space-y-3">
          {linhas.map((l, i) => {
            const turma = turmaDa(l);
            return (
              <div key={l.chave} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  {serieConhecida && outraSerie ? (
                    <div>
                      <label htmlFor={`serie-${l.chave}`} className="field-label">
                        Ano/série
                      </label>
                      <select id={`serie-${l.chave}`} value={l.serie} onChange={(e) => mudar(l.chave, { serie: e.target.value })} className="input-field">
                        {series.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : serieConhecida ? (
                    <div>
                      <span className="field-label">Ano/série</span>
                      <p className="mt-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700">{origem.serie}</p>
                    </div>
                  ) : null}
                  <div className={serieConhecida ? "" : "sm:col-span-2"}>
                    <label htmlFor={`ident-${l.chave}`} className="field-label">
                      {serieConhecida ? "Turma (letra ou número)" : "Nome da turma"}
                    </label>
                    <input
                      id={`ident-${l.chave}`}
                      type="text"
                      value={l.ident}
                      onChange={(e) => mudar(l.chave, { ident: e.target.value })}
                      maxLength={40}
                      placeholder={serieConhecida ? "Ex.: B, C ou 502" : "Ex.: 7º Ano B"}
                      className="input-field"
                    />
                  </div>
                  {linhas.length > 1 && (
                    <button type="button" onClick={() => setLinhas((a) => a.filter((x) => x.chave !== l.chave))} className="btn-perigo-suave" aria-label={`Tirar a turma ${i + 1} da lista`}>
                      Tirar
                    </button>
                  )}
                </div>
                {turma && (
                  <>
                    <input type="hidden" name="turma_destino" value={turma} />
                    <p className="mt-2 text-xs text-slate-600">
                      Nova turma: <strong className="text-slate-800">{turma}</strong> · título: <span className="text-slate-800">{tituloParaTurma(tituloOrigem, turmaOrigem, turma)}</span>
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {linhas.length < 30 && (
          <button
            type="button"
            onClick={() => {
              setLinhas((a) => [...a, { chave: proxima, serie: serieConhecida ? (outraSerie ? a[a.length - 1].serie : origem.serie) : "", ident: "" }]);
              setProxima((n) => n + 1);
            }}
            className="btn-verde-suave"
          >
            + Adicionar outra turma
          </button>
        )}

        {serieConhecida && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={outraSerie}
              onChange={(e) => setOutraSerie(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span>
              <span className="block font-semibold">Quero copiar também para outro ano/série</span>
              <span className="block text-xs text-slate-500">Marque só se o plano servir para outra série. Aí você escolhe a série de cada turma.</span>
            </span>
          </label>
        )}
      </SecaoPlano>

      <SecaoPlano id="copiar-2" numero={2} titulo="Escola e período" descricao="Já vêm com os dados do plano original — mude só se precisar." tom="azul">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="copiar-escola" className="field-label">
              Escola
            </label>
            <select id="copiar-escola" name="escola_id" value={escolaId} onChange={(e) => setEscolaId(e.target.value)} className="input-field">
              <option value="">Sem escola definida</option>
              {escolas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome} — {e.municipio}
                  {e.id === escolaOrigemId ? " (escola do plano original)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="copiar-inicio" className="field-label">
              Data de início
            </label>
            <input id="copiar-inicio" name="data_inicio" type="date" defaultValue={dataInicioOrigem ?? ""} className="input-field" />
          </div>
          <div>
            <label htmlFor="copiar-fim" className="field-label">
              Data de fim
            </label>
            <input id="copiar-fim" name="data_fim" type="date" defaultValue={dataFimOrigem ?? ""} className="input-field" />
          </div>
          <div>
            <label htmlFor="copiar-aulas" className="field-label">
              Número de aulas
            </label>
            <input id="copiar-aulas" name="quantidade_aulas" type="number" min={1} defaultValue={quantidadeAulasOrigem ?? ""} className="input-field" />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            name="abrir_edicao"
            defaultChecked
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span>
            <span className="block font-semibold">Abrir a primeira cópia para editar</span>
            <span className="block text-xs text-slate-500">Desmarcado, você volta para &quot;Meus planos&quot;. Cada cópia nasce como rascunho, com o conteúdo, as habilidades e as competências do original.</span>
          </span>
        </label>
      </SecaoPlano>

      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/dashboard/planos/${planoId}`} className="btn-azul-suave">
          Cancelar
        </Link>
      </div>

      <BarraSalvar
        pendente={pendente}
        textoBotao={destinos.length > 1 ? `Copiar para ${destinos.length} turmas` : "Copiar para a turma"}
        erro={estado.erro}
      />
    </form>
  );
}
