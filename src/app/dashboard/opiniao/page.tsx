import VoltarLink from "../planos/voltar-link";
import CabecalhoPagina from "@/components/cabecalho-pagina";
import OpiniaoForm from "./opiniao-form";

export default function OpiniaoPage() {
  return (
    <div className="mx-auto max-w-xl">
      <VoltarLink href="/dashboard" rotulo="Voltar ao início" />
      <CabecalhoPagina tom="rosa" ilustracao="opiniao" titulo="Sua opinião" subtitulo="São só 3 perguntas rápidas. Leva menos de um minuto." />
      <div className="mt-6">
        <OpiniaoForm />
      </div>
    </div>
  );
}
