import { Icone } from "@/components/icones";

/** Aviso mostrado depois de enviar um e-mail (confirmação de cadastro ou recuperação de senha). */
export default function AvisoSpam({ titulo = "Não encontrou o e-mail?" }: { titulo?: string }) {
  return (
    <div data-tom="ambar" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-950">
      <p className="flex items-center gap-2 font-bold">
        <Icone nome="alerta" className="h-4 w-4 shrink-0" />
        {titulo}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed text-amber-900">
        <li>
          Olhe a pasta de <strong>spam</strong>, <strong>lixo eletrônico</strong> ou <strong>promoções</strong>. Às vezes o e-mail cai lá.
        </li>
        <li>
          Se encontrar, marque como <strong>“não é spam”</strong> e clique no botão de confirmação.
        </li>
        <li>Pode levar alguns minutos para chegar. O remetente é <strong>naoresponda@planodocente.com.br</strong>.</li>
        <li>
          Ainda com problema? Escreva para{" "}
          <a href="mailto:contato@planodocente.com.br" className="font-bold underline underline-offset-2">
            contato@planodocente.com.br
          </a>
          .
        </li>
      </ul>
    </div>
  );
}
