"use client";

import { useState } from "react";
import AvatarColega from "@/components/avatar-colega";
import ConfirmarExclusao from "@/components/confirmar-exclusao";
import { Icone } from "@/components/icones";
import FormColega from "./form-colega";
import { excluirColega, type Colega } from "./actions";

export default function ColegasView({ colegas, emailAtivo }: { colegas: Colega[]; emailAtivo: boolean }) {
  const [editando, setEditando] = useState<string | null>(null);
  const [novo, setNovo] = useState(colegas.length === 0);

  return (
    <div className="space-y-5">
      {!emailAtivo && (
        <div role="note" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 text-sm text-amber-900">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Icone nome="alerta" className="h-4 w-4" />
          </span>
          <p>O envio por e-mail ainda será ativado pelo administrador. Você já pode cadastrar seus colegas: quando for ativado, eles aparecem prontos na hora de compartilhar.</p>
        </div>
      )}

      <section aria-labelledby="titulo-colegas" className="painel-cartao overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-primary-50 to-violet-50 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25">
              <Icone nome="usuarios" className="h-5 w-5" />
            </span>
            <div>
              <h2 id="titulo-colegas" className="text-lg font-extrabold leading-tight text-slate-900">
                Seus colegas
              </h2>
              <p className="text-xs font-semibold text-slate-500">{colegas.length} de 50 cadastrados</p>
            </div>
          </div>
          {!novo && (
            <button type="button" onClick={() => setNovo(true)} className="btn-azul">
              <Icone nome="mais" className="h-4 w-4" />
              Cadastrar colega
            </button>
          )}
        </div>

        <div className="p-5 sm:p-6">
          {novo && (
            <div className="mb-5 rounded-2xl border border-dashed border-primary-300 bg-primary-50 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-extrabold text-primary-800">
                <Icone nome="envelope" className="h-4 w-4" />
                Novo colega
              </p>
              <FormColega onSalvo={() => setNovo(false)} onCancelar={colegas.length > 0 ? () => setNovo(false) : undefined} />
            </div>
          )}

          {colegas.length === 0 && !novo ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Icone nome="usuarios" className="h-7 w-7" />
              </span>
              <p className="font-bold text-slate-800">Nenhum colega cadastrado</p>
              <p className="max-w-sm text-sm text-slate-600">Cadastre quem recebe seus planos. Na hora de compartilhar, você só escolhe o nome.</p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {colegas.map((c) => (
                <li key={c.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 transition hover:border-primary-200 hover:shadow-md">
                  {editando === c.id ? (
                    <FormColega colega={c} onSalvo={() => setEditando(null)} onCancelar={() => setEditando(null)} />
                  ) : (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <AvatarColega nome={c.nome} tamanho="lg" />
                      <span className="min-w-0 flex-1 basis-40">
                        <span className="block truncate font-bold text-slate-900">{c.nome}</span>
                        <span className="block truncate text-sm text-slate-500">{c.email}</span>
                      </span>
                      <span className="ml-auto flex shrink-0 items-center gap-1.5">
                        <button type="button" onClick={() => setEditando(c.id)} aria-label={`Editar ${c.nome}`} className="btn-azul-suave !h-9 !w-9 !p-0">
                          <Icone nome="lapis" className="h-4 w-4" />
                        </button>
                        <ConfirmarExclusao
                          excluirAction={excluirColega.bind(null, c.id)}
                          rotulo="Excluir"
                          oQue={`o colega “${c.nome}” da sua lista`}
                          detalhe="Os planos que você já enviou continuam com quem recebeu; só o cadastro some da sua lista."
                          classeBotao="btn-perigo-suave !px-3 !py-1.5 !text-xs"
                        />
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-slate-500">
        <Icone nome="cadeado" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Use só e-mails de colegas que concordam em receber seus planos. Quem recebe vê um link de leitura (não precisa ter conta). Os e-mails cadastrados ficam visíveis apenas para você.
      </p>
    </div>
  );
}
