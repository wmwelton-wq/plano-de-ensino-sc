import type { Metadata } from "next";
import Link from "next/link";
import DocumentoLegal, { Lista, Secao } from "@/components/documento-legal";
import { EMAIL_CONTATO, NOME_SERVICO, SITE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de Reembolso | Plano Docente",
  description:
    "Como funcionam cobrança, cancelamento e reembolso no Plano Docente, incluindo o direito de arrependimento previsto no Código de Defesa do Consumidor.",
};

const indice = [
  { id: "situacao-atual", titulo: "Situação atual: serviço gratuito" },
  { id: "quando-houver-cobranca", titulo: "Quando houver planos pagos" },
  { id: "arrependimento", titulo: "Direito de arrependimento (7 dias)" },
  { id: "cancelamento", titulo: "Cancelamento da assinatura" },
  { id: "reembolso-fora-prazo", titulo: "Reembolso fora do prazo de arrependimento" },
  { id: "cobranca-indevida", titulo: "Cobrança indevida ou erro técnico" },
  { id: "sem-reembolso", titulo: "Situações em que não há reembolso" },
  { id: "como-pedir", titulo: "Como pedir cancelamento ou reembolso" },
  { id: "alteracoes", titulo: "Alterações desta política" },
];

export default function ReembolsoPage() {
  return (
    <DocumentoLegal
      titulo="Política de Reembolso"
      resumo={`Em resumo: hoje o ${NOME_SERVICO} não cobra nada de ninguém — não há como pedir reembolso de algo que não foi cobrado. Esta página já explica, com antecedência, como vão funcionar cancelamento e reembolso quando os planos pagos (Mensal, Semestral e Anual) forem lançados: direito de arrependimento de 7 dias, cancelamento sem multa e devolução em caso de erro nosso.`}
      outro={{ href: "/privacidade", texto: "Aviso de Privacidade" }}
      indice={indice}
    >
      <Secao id="situacao-atual" numero={1} titulo="Situação atual: serviço gratuito">
        <p>
          Na data desta versão, o <strong>{NOME_SERVICO}</strong> ({SITE}) não cobra nenhuma
          quantia de nenhum usuário: o cadastro, o uso do aplicativo e os recursos disponíveis
          hoje são gratuitos. Como não há cobrança, não há, hoje, nada a reembolsar.
        </p>
        <p>
          Publicamos esta política antes de qualquer cobrança começar, para que você saiba, com
          antecedência e de forma clara, o que vai valer quando os planos pagos forem lançados —
          como exige a transparência que a lei espera de qualquer contratação paga pela internet.
        </p>
      </Secao>

      <Secao id="quando-houver-cobranca" numero={2} titulo="Quando houver planos pagos">
        <p>
          Os{" "}
          <Link href="/termos-de-uso#cobranca" className="link-primary">
            Termos de Uso
          </Link>{" "}
          já preveem que o {NOME_SERVICO} poderá oferecer assinaturas pagas (por exemplo, Mensal,
          Semestral e Anual). Antes de qualquer cobrança, vamos informar, de forma clara e no
          momento da compra: o preço exato, o que está incluído, a periodicidade (mensal,
          semestral ou anual), a forma de pagamento, a data de renovação e como cancelar. Nenhum
          valor será cobrado sem o seu consentimento expresso no momento da compra.
        </p>
      </Secao>

      <Secao id="arrependimento" numero={3} titulo="Direito de arrependimento (7 dias)">
        <p>
          Nas contratações feitas pela internet, você tem direito de desistir da compra em até{" "}
          <strong>7 (sete) dias corridos</strong> contados da confirmação do pagamento, sem
          precisar justificar o motivo, conforme o art. 49 do Código de Defesa do Consumidor
          (Lei nº 8.078/1990). Nesse caso, devolvemos o valor pago integralmente, pelo mesmo meio
          de pagamento usado na compra, em até 10 dias úteis após a confirmação do pedido de
          desistência.
        </p>
        <p>
          Esse prazo vale tanto para a primeira assinatura quanto para cada renovação cobrada,
          caso você decida não continuar logo após uma cobrança de renovação.
        </p>
      </Secao>

      <Secao id="cancelamento" numero={4} titulo="Cancelamento da assinatura">
        <p>
          Você poderá cancelar a assinatura quando quiser, sem multa, diretamente pela sua conta
          ou pelo email de contato. Ao cancelar:
        </p>
        <Lista>
          <li>
            você continua com acesso aos recursos pagos até o fim do período já pago (mês,
            semestre ou ano vigente);
          </li>
          <li>a renovação automática é interrompida e nenhuma nova cobrança será feita;</li>
          <li>
            fora do prazo de arrependimento do item 3, o cancelamento não gera reembolso
            proporcional do período já em andamento, salvo os casos do item 6.
          </li>
        </Lista>
      </Secao>

      <Secao id="reembolso-fora-prazo" numero={5} titulo="Reembolso fora do prazo de arrependimento">
        <p>
          Passados os 7 dias do item 3, o reembolso do período corrente não é automático. Mesmo
          assim, analisamos pedidos individuais com motivo relevante (por exemplo, cobrança
          duplicada, problema técnico que impediu o uso do serviço por tempo relevante, ou
          cobrança após um pedido de cancelamento já registrado), respondendo em até 15 dias.
        </p>
      </Secao>

      <Secao id="cobranca-indevida" numero={6} titulo="Cobrança indevida ou erro técnico">
        <p>
          Se identificarmos (ou você identificar e nos avisar) uma cobrança feita por erro — valor
          incorreto, cobrança em duplicidade, cobrança após cancelamento já confirmado ou falha que
          impediu o acesso ao que foi pago — devolvemos o valor correspondente, sem necessidade de
          abrir disputa com a operadora do cartão ou meio de pagamento, em até 10 dias úteis após
          a confirmação do erro.
        </p>
      </Secao>

      <Secao id="sem-reembolso" numero={7} titulo="Situações em que não há reembolso">
        <p>Não há reembolso, total ou parcial, quando:</p>
        <Lista>
          <li>
            o pedido de cancelamento ou de arrependimento for feito após o prazo do item 3, fora
            das situações do item 5 ou 6;
          </li>
          <li>
            a conta tiver sido suspensa ou encerrada por violação dos{" "}
            <Link href="/termos-de-uso#uso-proibido" className="link-primary">
              Termos de Uso
            </Link>{" "}
            (uso indevido, fraude ou tentativa de burlar a segurança do serviço);
          </li>
          <li>
            o motivo alegado for apenas não ter utilizado o período já pago, fora do prazo de
            arrependimento (o acesso esteve disponível durante todo o período).
          </li>
        </Lista>
      </Secao>

      <Secao id="como-pedir" numero={8} titulo="Como pedir cancelamento ou reembolso">
        <p>
          Envie um email para{" "}
          <a href={`mailto:${EMAIL_CONTATO}`} className="link-primary">
            {EMAIL_CONTATO}
          </a>{" "}
          a partir do endereço cadastrado na sua conta, informando o que deseja (cancelamento,
          arrependimento ou reembolso) e, se for o caso, o motivo. Para sua segurança, podemos
          pedir uma confirmação de identidade antes de processar o pedido. Respondemos em até 15
          dias, e o valor de um reembolso aprovado é devolvido pelo mesmo meio usado no pagamento.
        </p>
      </Secao>

      <Secao id="alteracoes" numero={9} titulo="Alterações desta política">
        <p>
          Podemos atualizar esta política antes do lançamento das assinaturas pagas, conforme a
          forma de cobrança for definida, e depois dele, para refletir mudanças no serviço ou na
          lei. Mudanças relevantes serão avisadas por email ou no site com antecedência razoável.
          Esta política faz parte dos{" "}
          <Link href="/termos-de-uso" className="link-primary">
            Termos de Uso
          </Link>{" "}
          e deve ser lida junto com eles e com o{" "}
          <Link href="/privacidade" className="link-primary">
            Aviso de Privacidade
          </Link>
          .
        </p>
      </Secao>
    </DocumentoLegal>
  );
}
