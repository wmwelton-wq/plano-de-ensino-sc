import EscolaForm from "../escola-form";
import { criarEscola } from "../actions";

export default function NovaEscolaPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Nova escola</h1>
      <div className="mt-6 max-w-lg card p-6">
        <EscolaForm action={criarEscola} textoBotao="Salvar escola" />
      </div>
    </div>
  );
}
