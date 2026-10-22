"use client";

import { useState } from "react";

interface OpcoesLogoProps {
  plano?: { incluir_logo_estado?: boolean | null; incluir_logo_escola?: boolean | null } | null;
}

const CAIXA = "h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500";

/**
 * Escolha do cabeçalho do plano:
 *  - "Cabeçalho da aplicação": só o texto padrão, sem imagens;
 *  - "Personalizar cabeçalho": até duas imagens (esquerda e direita) enviadas pelo professor no cadastro da escola.
 * Os campos incluir_logo_estado (imagem da esquerda) e incluir_logo_escola (imagem da direita) só existem no
 * formulário quando o cabeçalho é personalizado; sem eles, o plano sai só com o texto.
 */
export default function OpcoesLogo({ plano }: OpcoesLogoProps) {
  const [personalizado, setPersonalizado] = useState(
    plano ? plano.incluir_logo_estado !== false || plano.incluir_logo_escola !== false : false
  );

  return (
    <fieldset className="sm:col-span-2 rounded-xl border border-primary-100 bg-white p-4 shadow-sm">
      <legend className="px-1 text-sm font-bold text-slate-800">Cabeçalho do plano</legend>
      <div className="mt-1 space-y-2">
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="cabecalho_modo"
            value="aplicacao"
            checked={!personalizado}
            onChange={() => setPersonalizado(false)}
            className="mt-0.5 h-4 w-4 border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span>
            <strong>Utilizar o cabeçalho da aplicação</strong> — apenas o texto padrão, sem imagens.
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="cabecalho_modo"
            value="personalizado"
            checked={personalizado}
            onChange={() => setPersonalizado(true)}
            className="mt-0.5 h-4 w-4 border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span>
            <strong>Personalizar cabeçalho</strong> — usar imagens de cabeçalho enviadas por você.
          </span>
        </label>
      </div>

      {personalizado ? (
        <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="incluir_logo_estado" defaultChecked={plano?.incluir_logo_estado ?? true} className={CAIXA} />
            Imagem do lado esquerdo
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="incluir_logo_escola" defaultChecked={plano?.incluir_logo_escola ?? true} className={CAIXA} />
            Imagem do lado direito
          </label>
          <p className="text-xs leading-relaxed text-slate-500">
            As imagens vêm do cadastro da escola (menu Escolas → editar a escola). As imagens que você enviar são de
            inteira responsabilidade sua.
          </p>
        </div>
      ) : null}

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        O Plano Docente é independente: não tem parceria com a Secretaria de Estado da Educação nem com o governo de
        Santa Catarina.
      </p>
    </fieldset>
  );
}
