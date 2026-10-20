import type { Metadata } from "next";
import Link from "next/link";
import DocumentoLegal, { Lista, Secao, Tabela } from "@/components/documento-legal";
import { EMAIL_CONTATO, NOME_SERVICO, SITE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Aviso de Privacidade | Plano Docente",
  description:
    "Como o Plano Docente coleta, usa, protege e compartilha dados pessoais, e como exercer seus direitos pela LGPD.",
};

const indice = [
  { id: "quem-somos", titulo: "Quem somos e como falar conosco" },
  { id: "dados-coletados", titulo: "Quais dados coletamos" },
  { id: "finalidades", titulo: "Para que usamos os dados e em que base legal" },
  { id: "dados-de-alunos", titulo: "Dados de alunos: não coletamos" },
  { id: "compartilhamento", titulo: "Com quem compartilhamos" },
  { id: "transferencia", titulo: "Transferência internacional" },
  { id: "cookies", titulo: "Cookies e tecnologias semelhantes" },
  { id: "retencao", titulo: "Por quanto tempo guardamos" },
  { id: "seguranca", titulo: "Como protegemos os dados" },
  { id: "direitos", titulo: "Seus direitos" },
  { id: "menores", titulo: "Crianças e adolescentes" },
  { id: "decisoes-automatizadas", titulo: "Decisões automatizadas e IA" },
  { id: "incidentes", titulo: "Incidentes de segurança" },
  { id: "alteracoes", titulo: "Alterações deste aviso" },
  { id: "contato", titulo: "Contato e reclamações" },
];

export default function PrivacidadePage() {
  return (
    <DocumentoLegal
      titulo="Aviso de Privacidade"
      resumo={`Em resumo: pedimos apenas os dados necessários para você criar e guardar seus planos de ensino (nome, email, senha, escolas, turmas e os próprios planos). Não vendemos seus dados, não usamos anúncios e não coletamos dados de alunos. Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento pelo email ${EMAIL_CONTATO}.`}
      outro={{ href: "/termos-de-uso", texto: "Termos de Uso" }}
      indice={indice}
    >
      <Secao id="quem-somos" numero={1} titulo="Quem somos e como falar conosco">
        <p>
          Este Aviso explica, em linguagem simples, como o <strong>{NOME_SERVICO}</strong> (site{" "}
          {SITE}) trata dados pessoais, em conformidade com a Lei Geral de Proteção de Dados
          Pessoais (Lei nº 13.709/2018 — LGPD) e o Marco Civil da Internet (Lei nº 12.965/2014).
        </p>
        <p>
          O {NOME_SERVICO} é o <strong>controlador</strong> dos dados pessoais tratados no
          cadastro e no uso do serviço, ou seja, quem decide como e por que esses dados são
          usados. O canal de atendimento do responsável pelo tratamento de dados (encarregado) é o
          email{" "}
          <a href={`mailto:${EMAIL_CONTATO}`} className="link-primary">
            {EMAIL_CONTATO}
          </a>
          .
        </p>
        <p>
          O {NOME_SERVICO} é um serviço independente. Ele <strong>não</strong> é operado pela
          Secretaria de Estado da Educação de Santa Catarina nem por qualquer órgão público, e não
          recebe dados da rede de ensino.
        </p>
      </Secao>

      <Secao id="dados-coletados" numero={2} titulo="Quais dados coletamos">
        <p>Coletamos somente o necessário para o serviço funcionar:</p>
        <Tabela
          cabecalho={["Categoria", "Exemplos", "De onde vêm"]}
          linhas={[
            [
              "Dados de cadastro",
              "Nome completo, email e senha. A senha é guardada de forma criptografada (hash) e nós não conseguimos ver nem recuperar o texto dela.",
              "Informados por você ao criar a conta.",
            ],
            [
              "Conteúdo que você cria",
              "Escolas (nome, município e logo/brasão que você enviar), turmas, planos de ensino e os textos que você escrever neles.",
              "Informados por você durante o uso.",
            ],
            [
              "Registro do aceite",
              "Data e hora do aceite e a versão dos Termos de Uso e deste Aviso que você aceitou.",
              "Gerado no momento do cadastro.",
            ],
            [
              "Login com Google (opcional)",
              "Se você escolher entrar com o Google, recebemos seu nome e seu email. Não recebemos sua senha do Google nem acessamos seus arquivos ou contatos.",
              "Informados pelo Google com a sua autorização.",
            ],
            [
              "Calendário escolar (opcional)",
              "Datas que você cadastrar (festas, projetos, reuniões, feriados municipais) e a escolha de usar ou não o calendário. Se enviar o calendário da escola em PDF, o arquivo é lido por IA e não é guardado: salvamos apenas as datas que você confirmar.",
              "Informados por você.",
            ],
            [
              "Link de leitura (opcional)",
              "Se você criar um link para compartilhar um plano, guardamos uma cópia em PDF desse plano, acessível a quem tiver o link, por até 60 dias. Você pode encerrar o link antes disso.",
              "Gerado por você.",
            ],
            [
              "Colegas e envio por e-mail (opcional)",
              "Se você cadastrar colegas, guardamos o nome e o email que você informar, visíveis só para você. Ao enviar um plano, o colega recebe um email com o link de leitura e guardamos o registro do envio (email do destinatário, data e resultado) para controlar limites e evitar abuso. Cadastre apenas pessoas que concordam em receber seus planos.",
              "Informados por você.",
            ],
            [
              "Dados técnicos e de segurança",
              "Endereço IP, data e hora de acesso, tipo de navegador e dispositivo, páginas acessadas, tentativas de login e erros.",
              "Coletados automaticamente quando você acessa o site.",
            ],
            [
              "Localização aproximada",
              "Cidade, estado e país do seu acesso, deduzidos do provedor de internet no primeiro acesso e no mais recente. Não guardamos o endereço IP nesse registro, nem localização precisa (GPS).",
              "Coletada automaticamente ao acessar o painel. Usada só pela administração do serviço, para entender de onde vêm os cadastros e para segurança.",
            ],
            [
              "Verificação anti-robô",
              "Resultado da verificação do Cloudflare Turnstile (\"não sou um robô\"), que pode analisar sinais técnicos do navegador.",
              "Gerado ao entrar, cadastrar ou recuperar a senha.",
            ],
          ]}
        />
        <p>
          <strong>Não coletamos</strong> dados pessoais sensíveis (como saúde, religião, origem
          racial ou opinião política), CPF, documentos de identidade, dados bancários ou dados de
          cartão. Se no futuro houver cobrança, os dados de pagamento serão processados por um
          provedor de pagamentos especializado e este Aviso será atualizado antes disso (veja o
          item 14).
        </p>
      </Secao>

      <Secao id="finalidades" numero={3} titulo="Para que usamos os dados e em que base legal">
        <p>
          Cada uso de dados precisa ter uma finalidade clara e uma base legal prevista no art. 7º
          da LGPD:
        </p>
        <Tabela
          cabecalho={["Finalidade", "Base legal"]}
          linhas={[
            [
              "Criar e manter sua conta, permitir login e recuperação de senha, e guardar e exibir suas escolas, turmas e planos.",
              "Execução do contrato de uso do serviço, a seu pedido (art. 7º, V).",
            ],
            [
              "Enviar emails indispensáveis ao serviço: confirmação de cadastro, recuperação de senha e avisos de segurança ou de mudança nos termos. Não enviamos propaganda.",
              "Execução do contrato (art. 7º, V) e legítimo interesse (art. 7º, IX).",
            ],
            [
              "Proteger o serviço e as contas contra fraude, robôs, ataques e acessos indevidos (limite de tentativas de login, verificação anti-robô, registros de acesso).",
              "Legítimo interesse (art. 7º, IX), voltado à segurança do serviço e à prevenção de fraudes.",
            ],
            [
              "Guardar registros de acesso por no mínimo 6 meses, como exige a lei para provedores de aplicação.",
              "Cumprimento de obrigação legal (art. 7º, II; Marco Civil da Internet, art. 15).",
            ],
            [
              "Cobrança de funcionalidades pagas, quando existirem, e emissão dos documentos fiscais correspondentes.",
              "Execução do contrato (art. 7º, V) e cumprimento de obrigação legal (art. 7º, II).",
            ],
            [
              "Defender direitos do serviço ou seus em processos judiciais, administrativos ou arbitrais.",
              "Exercício regular de direitos (art. 7º, VI).",
            ],
            [
              "Melhorar o serviço com estatísticas agregadas de uso, sem identificar você.",
              "Legítimo interesse (art. 7º, IX), com dados anonimizados sempre que possível.",
            ],
          ]}
        />
        <p>
          Ao marcar a caixa de aceite no cadastro, você declara que leu este Aviso e os Termos de
          Uso e autoriza o tratamento dos dados necessários para funcionamento, segurança,
          cobrança e recuperação da conta. Para o que depende de consentimento, você pode revogá-lo
          quando quiser (item 10). Os usos acima que se apoiam em outras bases legais continuam
          sendo feitos dentro do que a lei permite.
        </p>
        <p>
          Nunca vendemos seus dados e nunca os usamos para publicidade de terceiros. Só usamos os
          dados para outras finalidades se forem compatíveis com as descritas aqui; do contrário,
          pediremos novo consentimento.
        </p>
      </Secao>

      <Secao id="dados-de-alunos" numero={4} titulo="Dados de alunos: não coletamos">
        <p>
          O {NOME_SERVICO} foi feito para planejar aulas, e não para registrar dados de estudantes.
          Os planos de ensino trabalham com turmas, disciplinas e currículo, e{" "}
          <strong>
            não devem conter nomes, fotos, documentos, notas individuais, laudos ou qualquer dado
            pessoal de alunos ou de familiares
          </strong>
          . Pedimos que você não insira esse tipo de informação nos campos livres. Se isso
          acontecer por engano, edite o plano ou nos avise para removermos.
        </p>
      </Secao>

      <Secao id="compartilhamento" numero={5} titulo="Com quem compartilhamos">
        <p>
          Seus dados só são acessados por quem precisa deles para o serviço funcionar. Usamos
          empresas contratadas (operadoras de dados) que seguem nossas instruções e têm obrigações
          de segurança e confidencialidade:
        </p>
        <Tabela
          cabecalho={["Empresa", "Para quê", "Dados envolvidos"]}
          linhas={[
            [
              "Supabase",
              "Banco de dados, autenticação (login), armazenamento de arquivos (logos) e envio dos emails de confirmação e recuperação de senha.",
              "Cadastro, conteúdo dos planos, logos enviadas, registros de autenticação.",
            ],
            [
              "Vercel",
              "Hospedagem do site e da aplicação.",
              "Dados técnicos de acesso (IP, navegador, páginas) e tráfego do site.",
            ],
            [
              "Google",
              "Somente se você escolher “Entrar com Google”: confirmar sua identidade.",
              "Nome e email da sua conta Google.",
            ],
            [
              "Provedores de IA (Google Gemini, OpenAI, Anthropic, DeepSeek, Mistral ou Groq)",
              "Somente quando você usa a IA do caminho metodológico ou envia um calendário em PDF. O servidor escolhe um provedor disponível; se um falhar, tenta outro.",
              "Título, turma, habilidades e conteúdos do plano e as instruções que você escrever (caminho metodológico); ou o PDF do calendário. Não enviamos seu nome, email, nem dados de alunos.",
            ],
            [
              "Resend",
              "Somente se você enviar um plano por email a um colega: entregar a mensagem.",
              "Nome e email do colega, seu nome, o título do plano e o link de leitura.",
            ],
            [
              "Cloudflare",
              "Proteção contra ataques (firewall e DNS) e verificação anti-robô (Turnstile).",
              "Dados técnicos de acesso, IP e sinais do navegador usados na verificação.",
            ],
          ]}
        />
        <p>Também podemos compartilhar dados quando:</p>
        <Lista>
          <li>
            houver <strong>ordem judicial</strong> ou requisição de autoridade competente, nos
            limites da lei;
          </li>
          <li>
            for necessário para <strong>defender direitos</strong> do {NOME_SERVICO} ou seus em
            processos;
          </li>
          <li>
            houver <strong>reorganização societária</strong> (por exemplo, venda do serviço), caso
            em que o novo responsável deverá respeitar este Aviso e você será informado.
          </li>
        </Lista>
        <p>
          Seus planos e escolas são visíveis apenas para a sua conta: o banco de dados aplica
          regras de isolamento para que um professor não acesse os dados de outro. O logo da escola
          que você envia fica em uma pasta de armazenamento com endereço público, para poder
          aparecer no cabeçalho dos planos e PDFs; não envie imagens que você não queira que
          outras pessoas possam abrir a partir do endereço do arquivo.
        </p>
      </Secao>

      <Secao id="transferencia" numero={6} titulo="Transferência internacional">
        <p>
          Os provedores acima podem armazenar e processar dados em servidores localizados fora do
          Brasil. Nesses casos, a transferência é feita com base no art. 33 da LGPD, usando
          provedores que adotam garantias adequadas de proteção (como cláusulas contratuais padrão
          e acordos de tratamento de dados) e medidas de segurança como criptografia em trânsito.
          Você pode pedir mais informações pelo canal de contato.
        </p>
      </Secao>

      <Secao id="cookies" numero={7} titulo="Cookies e tecnologias semelhantes">
        <p>
          Usamos apenas cookies e armazenamento <strong>estritamente necessários</strong> para o
          funcionamento do site:
        </p>
        <Lista>
          <li>
            <strong>Sessão de login (Supabase):</strong> mantém você conectado e protege sua
            conta. Sem ele não é possível usar a área do professor.
          </li>
          <li>
            <strong>Verificação anti-robô (Cloudflare Turnstile):</strong> usada para impedir uso
            automatizado nas telas de entrada.
          </li>
        </Lista>
        <p>
          Não usamos cookies de publicidade, de rastreamento entre sites nem ferramentas de
          análise de comportamento de terceiros. Como os cookies usados são essenciais, não há
          opção de recusá-los sem deixar de usar o serviço; você pode apagá-los pelo navegador, o
          que encerra sua sessão.
        </p>
      </Secao>

      <Secao id="retencao" numero={8} titulo="Por quanto tempo guardamos">
        <Lista>
          <li>
            <strong>Conta e planos:</strong> enquanto sua conta estiver ativa. Quando você pede a
            exclusão, apagamos ou anonimizamos os dados em até 30 dias, salvo o que a lei exigir
            que seja mantido.
          </li>
          <li>
            <strong>Registros de acesso (IP, data e hora):</strong> no mínimo 6 meses, conforme o
            Marco Civil da Internet, e depois eliminados ou anonimizados.
          </li>
          <li>
            <strong>Cópias de segurança (backups):</strong> podem manter os dados por um período
            adicional limitado (até 90 dias) até serem substituídas automaticamente.
          </li>
          <li>
            <strong>Registro do aceite dos termos:</strong> pelo prazo necessário para comprovar o
            consentimento e defender direitos, inclusive após o encerramento da conta, quando
            necessário.
          </li>
          <li>
            <strong>Dados fiscais e de cobrança</strong> (se houver): pelos prazos exigidos pela
            legislação tributária e civil.
          </li>
        </Lista>
      </Secao>

      <Secao id="seguranca" numero={9} titulo="Como protegemos os dados">
        <p>Adotamos medidas técnicas e administrativas para proteger seus dados, entre elas:</p>
        <Lista>
          <li>conexão criptografada (HTTPS) em todo o site;</li>
          <li>senhas armazenadas apenas em forma de hash, nunca em texto legível;</li>
          <li>
            regras de acesso no banco de dados para que cada professor acesse somente os próprios
            dados;
          </li>
          <li>
            firewall e proteção contra ataques, verificação anti-robô e limite de tentativas de
            login;
          </li>
          <li>links de confirmação e de recuperação de senha de uso único;</li>
          <li>acesso interno restrito ao necessário e uso de chaves secretas fora do código público.</li>
        </Lista>
        <p>
          Nenhum sistema é 100% invulnerável. Por isso, use uma senha forte e exclusiva, não a
          compartilhe e saia da conta em computadores de uso comum.
        </p>
      </Secao>

      <Secao id="direitos" numero={10} titulo="Seus direitos">
        <p>Pela LGPD (art. 18), você pode pedir a qualquer momento:</p>
        <Lista>
          <li>confirmação de que tratamos seus dados e acesso a eles;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>
            anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados
            em desacordo com a lei;
          </li>
          <li>portabilidade dos dados a outro serviço, quando regulamentada;</li>
          <li>eliminação dos dados tratados com base no seu consentimento;</li>
          <li>informação sobre com quem compartilhamos seus dados;</li>
          <li>
            informação sobre a possibilidade de não fornecer consentimento e sobre as consequências
            da recusa;
          </li>
          <li>revogação do consentimento;</li>
          <li>oposição a tratamento feito com base em outra hipótese legal, se houver descumprimento da lei;</li>
          <li>revisão de decisões tomadas unicamente de forma automatizada que afetem seus interesses.</li>
        </Lista>
        <p>
          <strong>Como pedir:</strong> envie um email para{" "}
          <a href={`mailto:${EMAIL_CONTATO}`} className="link-primary">
            {EMAIL_CONTATO}
          </a>{" "}
          a partir do email cadastrado na conta, dizendo o que deseja. Para sua segurança, podemos
          pedir uma confirmação de identidade. Respondemos em até <strong>15 dias</strong>. Alguns
          dados você mesmo pode ver e editar dentro do site (nome, escolas, turmas e planos).
        </p>
        <p>
          <strong>Importante sobre a exclusão:</strong> ao excluir a conta, seus planos e escolas
          são apagados e não podem ser recuperados. Exporte antes os PDFs que quiser guardar. Se
          você revogar o consentimento ou pedir a eliminação dos dados necessários ao
          funcionamento da conta, não será possível continuar usando o serviço.
        </p>
      </Secao>

      <Secao id="menores" numero={11} titulo="Crianças e adolescentes">
        <p>
          O serviço é destinado a <strong>professores maiores de 18 anos</strong>. Não coletamos
          intencionalmente dados de crianças e adolescentes. Se identificarmos que uma conta foi
          criada por menor de idade ou que dados de estudantes foram inseridos, poderemos apagá-los
          e encerrar a conta.
        </p>
      </Secao>

      <Secao id="decisoes-automatizadas" numero={12} titulo="Decisões automatizadas e IA">
        <p>
          O {NOME_SERVICO} não toma decisões automatizadas que afetem seus direitos. Oferecemos
          dois recursos opcionais de inteligência artificial: (1) a criação de um rascunho do
          “caminho metodológico” do plano e (2) a leitura do calendário escolar enviado por você em
          PDF (até 4 páginas, um envio a cada 3 meses). Nesses casos, enviamos a provedores de IA
          apenas o conteúdo necessário (dados pedagógicos do plano ou o PDF), sem seu nome, email
          nem dados de alunos. O resultado é sempre um rascunho: você revisa, edita e decide o que
          salvar. A IA pode errar e não substitui o seu julgamento profissional.
        </p>
      </Secao>

      <Secao id="incidentes" numero={13} titulo="Incidentes de segurança">
        <p>
          Se ocorrer um incidente de segurança que possa causar risco ou dano relevante aos
          titulares, comunicaremos você e a Autoridade Nacional de Proteção de Dados (ANPD), em
          prazo razoável, descrevendo o que aconteceu, quais dados foram afetados e as medidas
          adotadas, como determina o art. 48 da LGPD.
        </p>
      </Secao>

      <Secao id="alteracoes" numero={14} titulo="Alterações deste aviso">
        <p>
          Podemos atualizar este Aviso para refletir mudanças no serviço ou na lei, por exemplo
          ao lançar funcionalidades pagas ou recursos de IA. A data e a versão no topo da página
          mostram a revisão vigente. Quando a mudança for relevante, avisaremos por email ou
          dentro do site com antecedência razoável e, se necessário, pediremos novo aceite.
        </p>
      </Secao>

      <Secao id="contato" numero={15} titulo="Contato e reclamações">
        <p>
          Dúvidas, pedidos e reclamações sobre privacidade:{" "}
          <a href={`mailto:${EMAIL_CONTATO}`} className="link-primary">
            {EMAIL_CONTATO}
          </a>
          . Se entender que seus dados não foram tratados corretamente, você também pode
          apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD) em{" "}
          <a
            href="https://www.gov.br/anpd"
            target="_blank"
            rel="noopener noreferrer"
            className="link-primary"
          >
            gov.br/anpd
          </a>
          .
        </p>
        <p>
          Veja também os nossos{" "}
          <Link href="/termos-de-uso" className="link-primary">
            Termos de Uso
          </Link>
          .
        </p>
      </Secao>
    </DocumentoLegal>
  );
}
