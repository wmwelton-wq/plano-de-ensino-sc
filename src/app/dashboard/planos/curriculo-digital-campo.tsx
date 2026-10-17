"use client";

import type { HabilidadeCurricular, HabilidadeManual } from "@/lib/database.types";
import HabilidadePicker from "./habilidade-picker";

interface CurriculoDigitalCampoProps {
  usar: boolean;
  onUsarChange: (usar: boolean) => void;
  habilidades: HabilidadeCurricular[];
  selecionadasIniciais: string[];
  manuaisIniciais?: HabilidadeManual[];
  descricaoAjuda: string;
  vazio: string;
}

/**
 * Currículo de educação digital: a chave "usar / não usar" fica colada nas
 * habilidades, para o professor decidir e escolher no mesmo lugar. Desligada,
 * a lista some do formulário e do plano gerado.
 */
export default function CurriculoDigitalCampo({
  usar,
  onUsarChange,
  habilidades,
  selecionadasIniciais,
  manuaisIniciais,
  descricaoAjuda,
  vazio,
}: CurriculoDigitalCampoProps) {
  return (
    <div className="space-y-4">
      {/* Marca que este formulário controla as habilidades manuais (para o servidor saber que pode atualizá-las). */}
      <input type="hidden" name="tem_habilidades_manuais" value="1" />

      <label
        htmlFor="usar_curriculo_digital"
        className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary-200 bg-white p-4 shadow-sm transition hover:border-primary-300"
      >
        <input
          id="usar_curriculo_digital"
          name="usar_curriculo_digital"
          type="checkbox"
          checked={usar}
          onChange={(e) => onUsarChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-primary-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
        />
        <span>
          <span className="block text-sm font-bold text-slate-800">
            Utilizar o currículo de educação digital neste plano
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            {usar
              ? "Ativado: escolha as habilidades abaixo. Para não usar, desligue a chave — esta parte some do formulário e do plano."
              : "Desativado: esta parte não aparece no plano. Ligue a chave se quiser incluir habilidades de educação digital."}
          </span>
        </span>
      </label>

      {usar && (
        <HabilidadePicker
          descricaoAjuda={descricaoAjuda}
          habilidades={habilidades}
          selecionadasIniciais={selecionadasIniciais}
          manuaisIniciais={manuaisIniciais}
          vazio={vazio}
          rotuloBotao="Clique para adicionar habilidades de educação digital"
          permitirManual
        />
      )}
    </div>
  );
}
