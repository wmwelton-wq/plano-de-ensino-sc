import type { Metadata } from "next";
import Link from "next/link";
import DocumentoLegal, { Lista, Secao } from "@/components/documento-legal";
import { EMAIL_CONTATO, NOME_SERVICO, SITE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Termos de Uso | Plano Docente",
  description:
    "Regras de uso do Plano Docente, ferramenta para professores elaborarem planos de ensino.",
};

const indice = [
  { id: "aceitacao", titulo: "Aceitação dos termos" },
  { id: "servico", titulo: "O que é o serviço" },
  { id: "independencia", titulo: "Independência e símbolos oficiais" },
  { id: "cadastro", titulo: "Cadastro e conta" },
  { id: "uso-permitido", titulo: "Como você pode usar" },
  { id: "uso-proibido", titulo: "O que não é permitido" },
  { id: "seu-conteudo", titulo: "Seu conteúdo e seus planos" },
  { id: "dados-alunos", titulo: "Dados de alunos" },
  { id: "sugestoes", titulo: "Sugestões do currículo e responsabilidade pedagógica" },
  { id: "propriedade", titulo: "Propriedade intelectual" },
  { id: "disponibilidade", titulo: "Disponibilidade do serviço" },
  { id: "cobranca", titulo: "Gratuidade e cobrança" },
  { id: "ia", titulo: "Recursos de inteligência artificial" },
  { id: "responsabilidade", titulo: "Limitação de responsabilidade" },
  { id: "encerramento", titulo: "Suspensão e encerramento" },
  { id: "privacidade", titulo: "Privacidade" },
  { id: "alteracoes", titulo: "Alterações destes termos" },
  { id: "lei", titulo: "Lei aplicável, foro e contato" },
];

export default function TermosDeUsoPage() {
  return (
    <DocumentoLegal
      titulo="Termos de Uso"
      resumo="Em resumo: o Plano Docente ajuda professores a montar planos de ensino. Os planos são seus, você é responsável por revisá-los antes de usar, não deve inserir dados de alunos e deve manter sua senha em segurança. O serviço é independente e não tem vínculo com a Secretaria de Educação ou com o governo."
      outro={{ href: "/privacidade", texto: "Aviso de Privacidade" }}
      indice={indice}
    >
      <Secao id="aceitacao" numero={1} titulo="Aceitação dos termos">
        <p>
          Estes Termos de Uso regulam o uso do <strong>{NOME_SERVICO}</strong>, disponível em{" "}
          {SITE} (o “serviço”). Ao criar uma conta e marcar a caixa de aceite, ou ao usar o
          serviço, você declara que leu e concorda com estes Termos e com o{" "}
          <Link href="/privacidade" className="link-primary">
            Aviso de Privacidade
          </Link>
          . Se não concordar, não use o serviço.
        </p>
      </Secao>

      <Secao id="servico" numero={2} titulo="O que é o serviço">
        <p>
          O {NOME_SERVICO} é uma ferramenta online que ajuda professores a elaborar, organizar,
          editar e exportar planos de ensino (Educação Infantil, Ensino Fundamental, Ensino Médio
          e cursos técnicos), com listas de objetos de conhecimento, habilidades, competências e
          conteúdos baseados na Base Nacional Comum Curricular (BNCC), no Currículo Base do
          Território Catarinense e em outros documentos curriculares públicos.
        </p>
        <p>
          O serviço é uma ferramenta de apoio. Ele não substitui o julgamento pedagógico do
          professor, o projeto político-pedagógico da escola nem as orientações da sua rede de
          ensino.
        </p>
      </Secao>

      <Secao id="independencia" numero={3} titulo="Independência e símbolos oficiais">
        <p>
          O {NOME_SERVICO} é um serviço <strong>independente</strong>. Ele não é criado, mantido,
          aprovado ou endossado pela Secretaria de Estado da Educação de Santa Catarina, pelo
          Ministério da Educação ou por qualquer outro órgão público, e não fala em nome deles.
        </p>
        <p>
          Os documentos curriculares citados são públicos e de autoria dos respectivos órgãos. O
          serviço permite, por opção do professor, incluir no cabeçalho do plano o brasão do
          Estado de Santa Catarina e a logo da escola. Essa escolha é sua: use esses símbolos
          somente quando for apropriado ao seu contexto de trabalho e conforme as regras da sua
          escola e rede. Você é responsável por ter autorização para usar qualquer logo ou imagem
          que enviar.
        </p>
      </Secao>

      <Secao id="cadastro" numero={4} titulo="Cadastro e conta">
        <Lista>
          <li>Para usar o serviço é preciso criar uma conta pessoal, com nome e email válidos.</li>
          <li>Você precisa ter 18 anos ou mais e capacidade legal para aceitar estes Termos.</li>
          <li>
            As informações do cadastro devem ser verdadeiras e atualizadas. Cada conta é pessoal e
            não deve ser compartilhada nem vendida.
          </li>
          <li>
            Você é responsável por guardar sua senha e por tudo o que for feito com a sua conta.
            Se suspeitar de uso indevido, troque a senha e avise-nos imediatamente pelo email de
            contato.
          </li>
          <li>É necessário confirmar o email e passar pela verificação anti-robô para entrar.</li>
        </Lista>
      </Secao>

      <Secao id="uso-permitido" numero={5} titulo="Como você pode usar">
        <p>
          Você recebe uma licença pessoal, limitada, revogável e não exclusiva para usar o serviço
          para criar e gerenciar seus próprios planos de ensino, em atividades profissionais de
          docência, enquanto estes Termos estiverem em vigor.
        </p>
      </Secao>

      <Secao id="uso-proibido" numero={6} titulo="O que não é permitido">
        <p>Ao usar o serviço, você se compromete a não:</p>
        <Lista>
          <li>violar leis, direitos de terceiros ou estes Termos;</li>
          <li>
            inserir conteúdo ilegal, ofensivo, discriminatório, que viole direitos autorais ou que
            exponha dados pessoais de terceiros;
          </li>
          <li>
            tentar acessar contas, dados ou áreas que não são suas, ou burlar mecanismos de
            segurança, limites de uso ou a verificação anti-robô;
          </li>
          <li>
            usar robôs, scripts, scraping ou outros meios automatizados para extrair dados em
            massa ou sobrecarregar o serviço;
          </li>
          <li>
            fazer engenharia reversa, copiar, revender ou redistribuir o serviço, o código ou as
            listas organizadas pelo {NOME_SERVICO} como produto próprio;
          </li>
          <li>
            enviar vírus, códigos maliciosos ou arquivos que prejudiquem o funcionamento do
            serviço;
          </li>
          <li>
            enviar planos por email a pessoas que não concordaram em recebê-los, ou usar o envio de planos para spam ou
            propaganda;
          </li>
          <li>criar contas falsas ou se passar por outra pessoa ou instituição.</li>
        </Lista>
      </Secao>

      <Secao id="seu-conteudo" numero={7} titulo="Seu conteúdo e seus planos">
        <p>
          Os planos, textos, escolas e turmas que você cria são <strong>seus</strong>. O{" "}
          {NOME_SERVICO} não reivindica propriedade sobre eles.
        </p>
        <p>
          Para o serviço funcionar, você nos concede uma licença limitada, gratuita e não
          exclusiva para armazenar, processar, exibir e exportar o seu conteúdo
          <strong> somente</strong> para prestar o serviço a você (por exemplo, guardar seus
          planos, mostrá-los na tela e gerar o PDF). Não usamos o seu conteúdo para publicidade
          nem o vendemos.
        </p>
        <p>
          Você declara que tem direito de usar o conteúdo que inserir e responde por ele. Mantenha
          cópia dos PDFs e dos materiais importantes: recomendamos não depender apenas do serviço
          para guardar documentos essenciais.
        </p>
      </Secao>

      <Secao id="dados-alunos" numero={8} titulo="Dados de alunos">
        <p>
          O serviço não é um diário de classe nem um sistema de gestão escolar. É{" "}
          <strong>proibido</strong> inserir nos planos dados pessoais de alunos ou familiares
          (nomes, fotos, documentos, notas individuais, laudos, informações de saúde ou
          semelhantes). Planeje por turma, série e componente curricular. Se um dado desse tipo
          for inserido, remova-o ou nos avise para que possamos apagá-lo.
        </p>
      </Secao>

      <Secao
        id="sugestoes"
        numero={9}
        titulo="Sugestões do currículo e responsabilidade pedagógica"
      >
        <p>
          As listas de objetos de conhecimento, habilidades, competências e conteúdos são
          elaboradas a partir de documentos curriculares públicos. Em alguns casos (por exemplo,
          a organização dos objetos do Ensino Médio por série), a divisão é uma{" "}
          <strong>sugestão de apoio</strong> e pode não coincidir com a adotada pela sua escola ou
          rede. Apesar do cuidado na organização, podem existir erros, omissões ou diferenças em
          relação às versões oficiais mais recentes.
        </p>
        <p>
          Por isso, <strong>você é o responsável pelo conteúdo final do plano</strong>: confira
          códigos, descrições e adequação ao currículo oficial, ao projeto político-pedagógico e às
          normas da sua rede antes de entregar, publicar ou usar o plano. O {NOME_SERVICO} não
          garante que o plano gerado seja aprovado por coordenação, direção ou órgão de ensino.
        </p>
      </Secao>

      <Secao id="propriedade" numero={10} titulo="Propriedade intelectual">
        <p>
          O software, o design, a marca “{NOME_SERVICO}”, os textos do site e a forma como os
          dados curriculares foram organizados (listas, vínculos, sugestões e estrutura) pertencem
          ao {NOME_SERVICO} e são protegidos pela legislação de propriedade intelectual. Estes
          Termos não transferem nenhum desses direitos a você, exceto a licença de uso do item 5.
        </p>
        <p>
          A BNCC, o Currículo Base do Território Catarinense e demais documentos oficiais
          pertencem aos seus respectivos autores e órgãos e são citados com finalidade
          informativa e educacional. Se você acredita que algum conteúdo viola direito seu, escreva
          para o email de contato e analisaremos prontamente.
        </p>
      </Secao>

      <Secao id="disponibilidade" numero={11} titulo="Disponibilidade do serviço">
        <p>
          Trabalhamos para manter o serviço disponível e seguro, mas ele pode ficar indisponível
          por manutenção, atualização, falhas de terceiros (hospedagem, internet) ou motivos fora
          do nosso controle. O serviço está em evolução: funcionalidades podem ser criadas,
          alteradas ou removidas. Quando uma mudança relevante afetar seus dados ou o uso, vamos
          avisá-lo com antecedência razoável sempre que possível.
        </p>
      </Secao>

      <Secao id="cobranca" numero={12} titulo="Gratuidade e cobrança">
        <p>
          O {NOME_SERVICO} pode oferecer funcionalidades gratuitas e, futuramente, funcionalidades
          pagas (por exemplo, planos ou assinaturas). Antes de qualquer cobrança, informaremos de
          forma clara o preço, o que está incluído, a periodicidade, a forma de pagamento e como
          cancelar. Nada será cobrado sem o seu consentimento expresso.
        </p>
        <p>
          Nas contratações feitas pela internet, aplica-se o direito de arrependimento de 7 dias
          do Código de Defesa do Consumidor (art. 49), quando cabível. Condições específicas da
          contratação paga serão apresentadas no momento da compra e complementam estes Termos.
        </p>
      </Secao>

      <Secao id="ia" numero={13} titulo="Recursos de inteligência artificial">
        <p>
          O serviço oferece recursos opcionais de inteligência artificial (rascunho do caminho
          metodológico e leitura de calendário escolar em PDF). O que a IA gera é apenas um ponto
          de partida: pode conter imprecisões e deve ser revisado por você antes de qualquer uso.
          Esses recursos têm limites de uso por professor (por dia, por mês e, no caso do PDF do
          calendário, até 4 páginas e um envio a cada 3 meses). Os dados enviados estão descritos
          no Aviso de Privacidade.
        </p>
      </Secao>

      <Secao id="responsabilidade" numero={14} titulo="Limitação de responsabilidade">
        <p>
          O serviço é oferecido “no estado em que se encontra”, com o esforço razoável de
          qualidade e segurança. Dentro dos limites permitidos pela lei, o {NOME_SERVICO} não se
          responsabiliza por:
        </p>
        <Lista>
          <li>
            decisões tomadas ou documentos entregues com base em planos que você não conferiu;
          </li>
          <li>
            indisponibilidades, perda de dados ou falhas causadas por terceiros, por força maior
            ou por uso inadequado (como perda de senha ou uso por pessoas não autorizadas);
          </li>
          <li>
            conteúdo inserido por você ou uso de logos e símbolos sem a devida autorização;
          </li>
          <li>
            danos indiretos, lucros cessantes ou prejuízos que não decorram diretamente de falha
            do serviço.
          </li>
        </Lista>
        <p>
          Nada nestes Termos exclui ou limita responsabilidades que a lei não permite excluir,
          como as decorrentes de dolo, culpa grave ou dos direitos do consumidor previstos no
          Código de Defesa do Consumidor.
        </p>
      </Secao>

      <Secao id="encerramento" numero={15} titulo="Suspensão e encerramento">
        <p>
          Você pode parar de usar o serviço e pedir a exclusão da sua conta a qualquer momento
          pelo email de contato (veja o Aviso de Privacidade para saber o que acontece com os
          dados).
        </p>
        <p>
          Podemos suspender ou encerrar contas que violem estes Termos, coloquem a segurança do
          serviço em risco ou sejam usadas para fraude, mediante aviso quando possível. Em casos
          graves ou exigidos por lei, a suspensão pode ser imediata. Também podemos encerrar o
          serviço, com aviso prévio razoável e oportunidade para você exportar seus planos.
        </p>
      </Secao>

      <Secao id="privacidade" numero={16} titulo="Privacidade">
        <p>
          O tratamento dos seus dados pessoais é descrito no{" "}
          <Link href="/privacidade" className="link-primary">
            Aviso de Privacidade
          </Link>
          , que faz parte destes Termos.
        </p>
      </Secao>

      <Secao id="alteracoes" numero={17} titulo="Alterações destes termos">
        <p>
          Podemos atualizar estes Termos para refletir mudanças no serviço ou na lei. A data e a
          versão no topo da página indicam a revisão vigente. Mudanças relevantes serão informadas
          por email ou no próprio site com antecedência razoável e, quando necessário, pediremos
          novo aceite. Se não concordar com a nova versão, você pode encerrar sua conta; continuar
          usando o serviço após o aviso significa concordância, quando a lei permitir.
        </p>
      </Secao>

      <Secao id="lei" numero={18} titulo="Lei aplicável, foro e contato">
        <p>
          Estes Termos são regidos pelas leis da República Federativa do Brasil. Se houver
          conflito que não seja resolvido amigavelmente, fica eleito o foro do domicílio do
          usuário, quando ele for consumidor, ou, nos demais casos, o foro da comarca do
          responsável pelo {NOME_SERVICO}, com renúncia a qualquer outro, por mais privilegiado
          que seja.
        </p>
        <p>
          Dúvidas, sugestões e solicitações:{" "}
          <a href={`mailto:${EMAIL_CONTATO}`} className="link-primary">
            {EMAIL_CONTATO}
          </a>
          .
        </p>
      </Secao>
    </DocumentoLegal>
  );
}
