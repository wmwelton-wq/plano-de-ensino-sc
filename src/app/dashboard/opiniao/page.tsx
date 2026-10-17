import VoltarLink from "../planos/voltar-link";
import OpiniaoForm from "./opiniao-form";

export default function OpiniaoPage() {
  return (
    <div className="mx-auto max-w-xl">
      <VoltarLink href="/dashboard" rotulo="Voltar ao início" />
      <h1 className="text-2xl font-semibold text-slate-900">Sua opinião</h1>
      <p className="mt-2 text-sm text-slate-600">São só 3 perguntas rápidas. Leva menos de um minuto.</p>
      <div className="mt-6">
        <OpiniaoForm />
      </div>
    </div>
  );
}
