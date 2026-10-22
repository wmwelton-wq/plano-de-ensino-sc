"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import LinkNovaEscola from "@/components/link-nova-escola";
import type { EstadoFormulario } from "../../actions";
import SecaoPlano from "../../secao-plano";
import BarraSalvar from "../../barra-salvar";

interface EscolaOpcao {
  id: string;
  nome: string;
  municipio: string;
}

interface ReplicarFormProps {
  planoId: string;
  tituloOrigem: string;
  turmaOrigem: string | null;
  dataInicioOrigem: string | null;
  dataFimOrigem: string | null;
  quantidadeAulasOrigem: number | null;
  escolaOrigemId: string | null;
  escolas: EscolaOpcao[];
  action: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
}

/**
 * Replicar para outras escolas: o professor marca as escolas de destino e, para
 * cada uma, pode ajustar título, turma, período e número de aulas. O conteúdo
 * (objetos de conhecimento, habilidades, metodologia, avaliação) vai junto, e
 * dá para abrir a cópia logo depois para editar o restante.
 */
export default function ReplicarForm({
  planoId,
  tituloOrigem,
  turmaOrigem,
  dataInicioOrigem,
  dataFimOrigem,
  quantidadeAulasOrigem,
  escolaOrigemId,
  escolas,
  action,
}: ReplicarFormProps) {
  const [estado, formAction, pendente] = useActionState(action, {});
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());

  function alternar(id: string) {
    setSelecionadas((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  const escolasSelecionadas = escolas.filter((e) => selecionadas.has(e.id));

  return (
    <form action={formAction} className="space-y-6">
      <SecaoPlano
        id="replicar-1"
        numero={1}
        titulo="Escolha as escolas de destino"
        descricao="Marque uma ou mais escolas — o plano será copiado para cada uma, mudando só o cabeçalho."
      >
        {escolas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
            Você ainda não tem escolas cadastradas.{" "}
            <LinkNovaEscola className="font-semibold text-primary-600 hover:underline">
              Cadastrar escola
            </LinkNovaEscola>
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {escolas.map((e) => {
              const marcada = selecionadas.has(e.id);
              const ehOrigem = e.id === escolaOrigemId;
              return (
                <label
                  key={e.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm transition ${
                    marcada
                      ? "border-primary-500 bg-primary-50 text-primary-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-primary-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="escola_ids"
                    value={e.id}
                    checked={marcada}
                    onChange={() => alternar(e.id)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>
                    <span className="block font-semibold">{e.nome}</span>
                    <span className="block text-xs text-slate-500">
                      {e.municipio}
                      {ehOrigem ? " · escola do plano original" : ""}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
        <p className="text-xs text-slate-500">
          Falta alguma escola?{" "}
          <LinkNovaEscola className="font-semibold text-primary-600 hover:underline">
            Cadastrar nova escola
          </LinkNovaEscola>{" "}
          (depois volte aqui).
        </p>
      </SecaoPlano>

      {escolasSelecionadas.length > 0 && (
        <SecaoPlano
          id="replicar-2"
          numero={2}
          titulo="Ajuste o que precisar em cada escola"
          descricao="Tudo já vem preenchido com os dados do plano original — mude só o que for diferente."
        >
          <div className="space-y-4">
            {escolasSelecionadas.map((e) => (
              <div key={e.id} className="rounded-xl border border-primary-100 bg-primary-50/40 p-4">
                <p className="mb-3 text-sm font-bold text-primary-800">{e.nome}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor={`titulo_${e.id}`} className="field-label">
                      Título do plano
                    </label>
                    <input
                      id={`titulo_${e.id}`}
                      name={`titulo_${e.id}`}
                      type="text"
                      defaultValue={`${tituloOrigem} — ${e.nome}`}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor={`turma_${e.id}`} className="field-label">
                      Turma
                    </label>
                    <input
                      id={`turma_${e.id}`}
                      name={`turma_${e.id}`}
                      type="text"
                      defaultValue={turmaOrigem ?? ""}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor={`quantidade_aulas_${e.id}`} className="field-label">
                      Número de aulas
                    </label>
                    <input
                      id={`quantidade_aulas_${e.id}`}
                      name={`quantidade_aulas_${e.id}`}
                      type="number"
                      min={1}
                      defaultValue={quantidadeAulasOrigem ?? ""}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor={`data_inicio_${e.id}`} className="field-label">
                      Data de início
                    </label>
                    <input
                      id={`data_inicio_${e.id}`}
                      name={`data_inicio_${e.id}`}
                      type="date"
                      defaultValue={dataInicioOrigem ?? ""}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor={`data_fim_${e.id}`} className="field-label">
                      Data de fim
                    </label>
                    <input
                      id={`data_fim_${e.id}`}
                      name={`data_fim_${e.id}`}
                      type="date"
                      defaultValue={dataFimOrigem ?? ""}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              name="abrir_edicao"
              defaultChecked={escolasSelecionadas.length === 1}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span>
              <span className="block font-semibold">Abrir a cópia para editar o plano completo</span>
              <span className="block text-xs text-slate-500">
                Ao terminar, abre o plano criado (o da primeira escola) para você mudar qualquer outro
                trecho — objetos de conhecimento, habilidades, metodologia, avaliação... Desmarcado, você volta para
                &quot;Meus planos&quot;.
              </span>
            </span>
          </label>

          <p className="text-xs text-slate-500">
            Cada cópia nasce como rascunho e leva o conteúdo, as habilidades e as competências do plano original.
          </p>
        </SecaoPlano>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/dashboard/planos/${planoId}`} className="btn-azul-suave">
          Cancelar
        </Link>
      </div>

      <BarraSalvar
        pendente={pendente}
        textoBotao={
          escolasSelecionadas.length > 1
            ? `Replicar para ${escolasSelecionadas.length} escolas`
            : "Replicar plano"
        }
        erro={estado.erro}
      />
    </form>
  );
}
