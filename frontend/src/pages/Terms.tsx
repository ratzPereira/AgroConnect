import { LegalPageLayout } from '@/components/LegalPageLayout';
import { SEOHead } from '@/components/SEOHead';

const TOC_ITEMS = [
  { id: 'identificacao', label: '1. Identificacao' },
  { id: 'definicoes', label: '2. Definicoes' },
  { id: 'aceitacao', label: '3. Aceitacao dos Termos' },
  { id: 'registo', label: '4. Registo e Conta' },
  { id: 'funcionamento', label: '5. Funcionamento' },
  { id: 'pagamentos', label: '6. Pagamentos' },
  { id: 'obrigacoes-cliente', label: '7. Obrigacoes do Cliente' },
  { id: 'obrigacoes-prestador', label: '8. Obrigacoes do Prestador' },
  { id: 'avaliacoes', label: '9. Avaliacoes' },
  { id: 'cancelamentos', label: '10. Cancelamentos' },
  { id: 'disputas', label: '11. Disputas' },
  { id: 'propriedade-intelectual', label: '12. Propriedade Intelectual' },
  { id: 'limitacao-responsabilidade', label: '13. Limitacao de Responsabilidade' },
  { id: 'protecao-dados', label: '14. Protecao de Dados' },
  { id: 'alteracoes', label: '15. Alteracoes aos Termos' },
  { id: 'lei-aplicavel', label: '16. Lei Aplicavel' },
];

const SECTIONS = [
  {
    id: 'identificacao',
    title: '1. Identificacao',
    content: (
      <>
        <p>
          A plataforma AgroConnect (doravante designada por &quot;Plataforma&quot;) e uma plataforma
          digital de intermediacao de servicos agricolas, desenvolvida no ambito do projeto final da
          Licenciatura em Engenharia Informatica (LEI) da Universidade Aberta, Portugal. A Plataforma
          tem como objetivo facilitar a ligacao entre agricultores que necessitam de servicos
          especializados e prestadores de servicos agricolas qualificados.
        </p>
        <p>
          A AgroConnect e operada pela entidade responsavel pelo projeto academico, com sede ficticia
          na Rua do Comercio, n.o 42, 9500-042 Ponta Delgada, ilha de Sao Miguel, Regiao Autonoma dos
          Acores, Portugal. Para efeitos de comunicacao, o endereco de contacto eletronico e{' '}
          <strong>info@agroconnect.pt</strong>.
        </p>
        <p>
          A Plataforma opera exclusivamente em territorio portugues, com especial enfoque na Regiao
          Autonoma dos Acores, onde a atividade agricola representa um pilar fundamental da economia
          regional. Todos os servicos disponibilizados atraves da Plataforma estao sujeitos a
          legislacao portuguesa e europeia aplicavel.
        </p>
        <p>
          O presente documento constitui os Termos e Condicoes de Utilizacao da Plataforma
          AgroConnect, regulando a relacao entre a Plataforma e os seus utilizadores registados.
          A utilizacao da Plataforma implica a leitura, compreensao e aceitacao integral dos presentes
          Termos.
        </p>
      </>
    ),
  },
  {
    id: 'definicoes',
    title: '2. Definicoes',
    content: (
      <>
        <p>
          Para efeitos dos presentes Termos e Condicoes, os seguintes termos terao o significado que
          lhes e atribuido abaixo:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Plataforma</strong> &mdash; o sistema digital AgroConnect, acessivel atraves da
            aplicacao web e da aplicacao web progressiva (PWA), incluindo todas as suas
            funcionalidades, interfaces e servicos associados.
          </li>
          <li>
            <strong>Utilizador</strong> &mdash; qualquer pessoa singular ou coletiva que se registe e
            utilize a Plataforma, independentemente do papel que desempenhe (Cliente ou Prestador).
          </li>
          <li>
            <strong>Cliente</strong> &mdash; o utilizador que publica pedidos de servico agricola na
            Plataforma, solicitando a realizacao de trabalhos especificos nas suas propriedades ou
            terrenos.
          </li>
          <li>
            <strong>Prestador</strong> &mdash; o utilizador (pessoa singular ou entidade) que oferece
            servicos agricolas atraves da Plataforma, respondendo a pedidos de servico com propostas
            comerciais. O Prestador pode ter diferentes papeis dentro da sua organizacao: Gestor,
            Lider de Equipa ou Operador.
          </li>
          <li>
            <strong>Servico</strong> &mdash; qualquer atividade agricola prestada por um Prestador a
            um Cliente, incluindo, mas nao se limitando a, lavoura, pulverizacao, ceifa, plantacao,
            poda, jardinagem e manutencao de terrenos.
          </li>
          <li>
            <strong>Pedido de Servico</strong> &mdash; a publicacao feita por um Cliente na Plataforma,
            descrevendo o servico agricola pretendido, incluindo localizacao, area, tipo de servico e
            demais detalhes relevantes.
          </li>
          <li>
            <strong>Proposta</strong> &mdash; a oferta comercial apresentada por um Prestador em
            resposta a um Pedido de Servico, incluindo preco, prazo estimado e condicoes de execucao.
          </li>
          <li>
            <strong>Escrow</strong> &mdash; o mecanismo de retencao temporaria de fundos pela
            Plataforma, que garante que o pagamento do Cliente fica reservado ate a confirmacao da
            conclusao satisfatoria do servico.
          </li>
          <li>
            <strong>Comissao</strong> &mdash; a percentagem retida pela Plataforma sobre o valor de
            cada transacao concluida, como remuneracao pelos servicos de intermediacao prestados.
          </li>
          <li>
            <strong>Avaliacao</strong> &mdash; a classificacao numerica (de 1 a 5 estrelas) e o
            comentario textual que cada parte pode atribuir a outra apos a conclusao de um servico.
          </li>
          <li>
            <strong>Conta</strong> &mdash; o perfil pessoal e credenciais de acesso de um Utilizador
            registado na Plataforma, incluindo todos os dados, historico e configuracoes associadas.
          </li>
          <li>
            <strong>Dados Pessoais</strong> &mdash; qualquer informacao relativa a uma pessoa singular
            identificada ou identificavel, conforme definido no Regulamento Geral sobre a Protecao de
            Dados (RGPD).
          </li>
          <li>
            <strong>Backoffice</strong> &mdash; a area de gestao interna da Plataforma disponibilizada
            aos Prestadores para administracao das suas equipas, maquinas, inventario e operacoes
            comerciais.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'aceitacao',
    title: '3. Aceitacao dos Termos',
    content: (
      <>
        <p>
          Ao aceder, navegar ou utilizar a Plataforma AgroConnect de qualquer forma, o Utilizador
          declara ter lido, compreendido e aceite integralmente os presentes Termos e Condicoes de
          Utilizacao, bem como a Politica de Privacidade, que constitui parte integrante destes
          Termos.
        </p>
        <p>
          A utilizacao da Plataforma e reservada a pessoas com idade igual ou superior a 18 (dezoito)
          anos, ou a menores devidamente representados pelo respetivo representante legal. Ao registar-se,
          o Utilizador declara ter a idade minima exigida e possuir plena capacidade juridica para
          celebrar contratos vinculativos ao abrigo da legislacao portuguesa.
        </p>
        <p>
          No caso de pessoas coletivas, o registo deve ser efetuado por um representante legal
          devidamente autorizado, que garante ter poderes para vincular a entidade aos presentes
          Termos. A pessoa coletiva sera responsavel por todos os atos praticados atraves da Conta
          criada em seu nome.
        </p>
        <p>
          Ao completar o processo de registo, o Utilizador consente expressamente em receber
          comunicacoes da Plataforma, incluindo notificacoes de servico (como atualizacoes de estado
          de pedidos, propostas recebidas e alertas de pagamento), bem como comunicacoes informativas
          sobre novas funcionalidades e melhorias da Plataforma. O Utilizador pode, a qualquer
          momento, optar por nao receber comunicacoes promocionais atraves das definicoes da sua
          Conta, sem prejuizo das notificacoes essenciais ao funcionamento do servico.
        </p>
        <p>
          Caso o Utilizador nao concorde com alguma disposicao dos presentes Termos, devera abster-se
          de utilizar a Plataforma e, se ja tiver uma Conta registada, podera solicitar a sua
          eliminacao nos termos previstos na Politica de Privacidade.
        </p>
      </>
    ),
  },
  {
    id: 'registo',
    title: '4. Registo e Conta',
    content: (
      <>
        <p>
          Para aceder as funcionalidades da Plataforma, o Utilizador devera criar uma Conta pessoal,
          fornecendo informacoes verdadeiras, completas e atualizadas. O processo de registo exige, no
          minimo, a indicacao de nome completo, endereco de correio eletronico valido, numero de
          telefone e a criacao de uma palavra-passe segura.
        </p>
        <p>
          O Utilizador e integralmente responsavel por manter a confidencialidade das suas credenciais
          de acesso (endereco de correio eletronico e palavra-passe). Qualquer atividade realizada
          atraves da Conta sera considerada como tendo sido efetuada pelo respetivo titular. Em caso
          de suspeita de acesso nao autorizado, o Utilizador devera notificar imediatamente a
          Plataforma atraves do endereco info@agroconnect.pt e proceder a alteracao da sua
          palavra-passe.
        </p>
        <p>
          Cada pessoa singular ou coletiva pode deter apenas uma Conta na Plataforma. A criacao de
          contas multiplas pelo mesmo Utilizador constitui violacao dos presentes Termos e podera
          resultar na suspensao ou encerramento de todas as contas associadas, sem prejuizo de outras
          medidas que a Plataforma entenda adequadas.
        </p>
        <p>
          O registo na Plataforma esta sujeito a verificacao do endereco de correio eletronico. O
          Utilizador recebera uma mensagem de verificacao no endereco indicado e devera confirmar a
          sua identidade antes de poder utilizar plenamente a Plataforma. Contas nao verificadas no
          prazo de 30 (trinta) dias apos o registo poderao ser automaticamente eliminadas.
        </p>
        <p>
          A Plataforma reserva-se o direito de suspender, limitar ou encerrar qualquer Conta, de forma
          temporaria ou permanente, caso se verifique a violacao dos presentes Termos, a prestacao de
          informacoes falsas ou enganosas, a utilizacao abusiva ou fraudulenta da Plataforma, ou por
          razoes de seguranca. Em caso de encerramento, o Utilizador sera notificado por correio
          eletronico com a fundamentacao da decisao e podera exercer o direito de reclamacao.
        </p>
        <p>
          Os Prestadores que desejem oferecer servicos atraves da Plataforma deverao completar um
          perfil profissional detalhado, incluindo informacoes sobre a sua area de atuacao geografica,
          categorias de servico oferecidas, equipamentos disponiveis e, quando aplicavel, certificacoes
          ou licencas profissionais relevantes.
        </p>
      </>
    ),
  },
  {
    id: 'funcionamento',
    title: '5. Funcionamento da Plataforma',
    content: (
      <>
        <p>
          A AgroConnect funciona como uma plataforma de intermediacao digital que conecta Clientes e
          Prestadores de servicos agricolas. A Plataforma nao e parte nos contratos de prestacao de
          servicos celebrados entre Clientes e Prestadores, atuando exclusivamente como facilitadora
          da comunicacao, negociacao e gestao de pagamentos entre ambas as partes.
        </p>
        <p>
          O ciclo de vida completo de um servico na Plataforma segue as seguintes etapas:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Criacao do Pedido:</strong> O Cliente cria um Pedido de Servico, descrevendo em
            detalhe o servico pretendido, incluindo a localizacao exata (com coordenadas GPS), a area
            aproximada do terreno, a categoria de servico, um prazo desejado e quaisquer requisitos
            especificos.
          </li>
          <li>
            <strong>Publicacao e Visibilidade:</strong> Apos criacao, o pedido pode ser publicado,
            tornando-se visivel para todos os Prestadores que operam na area geografica correspondente
            e que oferecem a categoria de servico solicitada.
          </li>
          <li>
            <strong>Apresentacao de Propostas:</strong> Os Prestadores interessados submetem Propostas
            comerciais ao pedido, indicando o preco proposto, o prazo estimado de execucao, as
            condicoes de servico e quaisquer observacoes relevantes. O Cliente recebe notificacao de
            cada nova proposta.
          </li>
          <li>
            <strong>Selecao da Proposta:</strong> O Cliente analisa as propostas recebidas, podendo
            consultar o perfil, a avaliacao e o historico de cada Prestador, e seleciona a proposta
            que melhor se adequa as suas necessidades.
          </li>
          <li>
            <strong>Pagamento em Escrow:</strong> Apos a aceitacao de uma proposta, o Cliente efetua o
            pagamento correspondente, que fica retido em regime de Escrow na Plataforma ate a
            confirmacao da conclusao do servico.
          </li>
          <li>
            <strong>Execucao do Servico:</strong> O Prestador realiza o servico no local e prazo
            acordados. A Plataforma dispoe de mecanismos de verificacao de presenca geografica
            (check-in GPS) para confirmar que o Prestador se deslocou efetivamente ao local indicado.
          </li>
          <li>
            <strong>Confirmacao pelo Cliente:</strong> Apos a conclusao do servico, o Cliente confirma
            que o trabalho foi realizado de forma satisfatoria. Esta confirmacao aciona a libertacao
            dos fundos retidos em Escrow.
          </li>
          <li>
            <strong>Avaliacao Bilateral:</strong> Ambas as partes sao convidadas a avaliar a experiencia,
            atribuindo uma classificacao de 1 a 5 estrelas e, opcionalmente, um comentario textual. As
            avaliacoes sao publicadas nos respetivos perfis e contribuem para a reputacao de cada
            utilizador na Plataforma.
          </li>
        </ul>
        <p>
          A Plataforma envidara os melhores esforcos para assegurar a disponibilidade continua do
          servico, mas nao garante o funcionamento ininterrupto, podendo ocorrer periodos de
          indisponibilidade para manutencao, atualizacao ou por motivos de forca maior.
        </p>
      </>
    ),
  },
  {
    id: 'pagamentos',
    title: '6. Pagamentos e Comissoes',
    content: (
      <>
        <p>
          Todos os pagamentos efetuados atraves da Plataforma sao processados por fornecedores de
          servicos de pagamento terceiros (nomeadamente Stripe), em conformidade com as normas de
          seguranca PCI-DSS. A Plataforma nao armazena diretamente dados de cartoes de credito ou
          debito dos Utilizadores.
        </p>
        <p>
          O sistema de Escrow constitui o mecanismo central de protecao financeira da Plataforma.
          Quando um Cliente aceita uma Proposta, o valor total do servico e imediatamente cobrado e
          retido pela Plataforma. Os fundos permanecem em custodia ate que se verifique uma das
          seguintes condicoes: (a) o Cliente confirma a conclusao satisfatoria do servico; (b) decorre
          o prazo automatico de confirmacao sem que o Cliente tenha levantado objecao; ou (c) uma
          disputa e resolvida a favor do Prestador.
        </p>
        <p>
          A Plataforma cobra uma comissao de <strong>10% (dez por cento)</strong> sobre o valor total
          de cada transacao concluida com sucesso. Esta comissao e deduzida automaticamente do
          montante retido em Escrow antes da transferencia dos fundos para o Prestador. O Prestador
          recebe, assim, 90% do valor acordado com o Cliente.
        </p>
        <p>
          Apos a confirmacao do servico, a Plataforma processara a transferencia dos fundos para a
          conta do Prestador num prazo maximo de 5 (cinco) dias uteis. O prazo efetivo podera variar
          consoante o fornecedor de servicos de pagamento e a instituicao bancaria do Prestador.
        </p>
        <p>
          Em caso de reembolso ao Cliente (por cancelamento, disputa ou outra razao prevista nestes
          Termos), o montante sera devolvido ao metodo de pagamento original num prazo maximo de 10
          (dez) dias uteis. A Plataforma nao sera responsavel por atrasos imputaveis a instituicoes
          financeiras terceiras.
        </p>
        <p>
          Os precos apresentados na Plataforma incluem IVA a taxa legal em vigor, quando aplicavel. Os
          Prestadores sao responsaveis pelo cumprimento das suas obrigacoes fiscais, incluindo a
          emissao de faturas e o pagamento de impostos devidos pela prestacao de servicos.
        </p>
      </>
    ),
  },
  {
    id: 'obrigacoes-cliente',
    title: '7. Obrigacoes do Cliente',
    content: (
      <>
        <p>
          O Cliente compromete-se a cumprir as seguintes obrigacoes ao utilizar a Plataforma
          AgroConnect:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Descricao precisa dos servicos:</strong> O Cliente deve fornecer descricoes
            detalhadas e verdadeiras dos servicos pretendidos, incluindo a localizacao exata do
            terreno, a area aproximada, as condicoes de acesso, a existencia de obstaculos ou
            condicionantes relevantes, e quaisquer requisitos especificos que possam influenciar a
            execucao do servico ou o preco proposto.
          </li>
          <li>
            <strong>Resposta atempada:</strong> O Cliente deve analisar e responder as Propostas
            recebidas num prazo razoavel. A inacao prolongada podera resultar na expiracao do Pedido de
            Servico e na consequente perda das propostas apresentadas.
          </li>
          <li>
            <strong>Confirmacao apos conclusao:</strong> Apos a execucao do servico, o Cliente
            dispoe de um prazo de 72 (setenta e duas) horas para confirmar a conclusao satisfatoria
            do trabalho ou, alternativamente, abrir uma disputa fundamentada. Decorrido este prazo sem
            qualquer acao, a confirmacao sera considerada automatica e os fundos serao libertados ao
            Prestador.
          </li>
          <li>
            <strong>Avaliacoes honestas:</strong> O Cliente deve avaliar cada servico concluido de
            forma justa, objetiva e fundamentada. Avaliacoes falsas, difamatorias ou que visem
            prejudicar injustamente um Prestador constituem violacao dos presentes Termos.
          </li>
          <li>
            <strong>Cumprimento das obrigacoes de pagamento:</strong> O Cliente e responsavel por
            assegurar que dispoe de fundos suficientes para efetuar os pagamentos atraves da
            Plataforma. Pagamentos recusados ou devolvidos poderao resultar na suspensao temporaria
            da Conta.
          </li>
          <li>
            <strong>Acesso ao local:</strong> O Cliente deve garantir que o Prestador tera acesso ao
            local de realizacao do servico na data e hora acordadas, bem como as condicoes minimas
            necessarias para a execucao segura do trabalho.
          </li>
        </ul>
        <p>
          O incumprimento reiterado das obrigacoes acima referidas podera resultar em advertencias,
          suspensao temporaria ou encerramento permanente da Conta do Cliente, sem prejuizo de
          eventuais responsabilidades civis ou penais.
        </p>
      </>
    ),
  },
  {
    id: 'obrigacoes-prestador',
    title: '8. Obrigacoes do Prestador',
    content: (
      <>
        <p>
          O Prestador compromete-se a cumprir as seguintes obrigacoes ao utilizar a Plataforma
          AgroConnect:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Execucao conforme proposto:</strong> O Prestador deve executar o servico em
            conformidade com as condicoes descritas na sua Proposta aceite, incluindo o tipo de
            trabalho, os metodos utilizados, o prazo e o nivel de qualidade comprometido. Qualquer
            alteracao significativa deve ser previamente comunicada e acordada com o Cliente.
          </li>
          <li>
            <strong>Cumprimento de prazos:</strong> O Prestador deve respeitar os prazos de execucao
            indicados na Proposta. Em caso de impossibilidade de cumprimento, o Prestador deve
            notificar o Cliente e a Plataforma com a maior antecedencia possivel, apresentando uma
            justificacao e, quando viavel, propondo uma nova data.
          </li>
          <li>
            <strong>Qualificacoes e seguros:</strong> O Prestador declara possuir as qualificacoes
            profissionais, licencas e seguros necessarios para a realizacao dos servicos que oferece.
            A Plataforma podera, a qualquer momento, solicitar comprovativo destas qualificacoes.
          </li>
          <li>
            <strong>Check-in GPS:</strong> O Prestador deve efetuar o check-in de presenca geografica
            atraves da Plataforma ao chegar ao local de realizacao do servico. Este mecanismo destina-se
            a confirmar a presenca efetiva do Prestador e constitui uma condicao para a validacao da
            execucao do servico.
          </li>
          <li>
            <strong>Manutencao de equipamentos:</strong> O Prestador e responsavel por assegurar que
            todos os equipamentos e maquinas utilizados na prestacao de servicos se encontram em boas
            condicoes de funcionamento, cumprindo as normas de seguranca aplicaveis. O registo e
            atualizacao do inventario de equipamentos no Backoffice e obrigatorio.
          </li>
          <li>
            <strong>Perfil verdadeiro:</strong> O Prestador deve manter o seu perfil profissional
            atualizado e fidedigno, incluindo as areas de servico, a zona geografica de atuacao, a
            experiencia profissional e os equipamentos disponiveis. Informacoes falsas ou enganosas
            no perfil constituem violacao grave dos presentes Termos.
          </li>
        </ul>
        <p>
          O Prestador e integralmente responsavel pela seguranca no local de trabalho, devendo cumprir
          todas as normas de saude e seguranca no trabalho aplicaveis. A Plataforma nao assume
          qualquer responsabilidade por acidentes, danos ou prejuizos ocorridos durante a execucao
          dos servicos.
        </p>
        <p>
          O incumprimento das obrigacoes acima referidas podera resultar em penalizacoes na avaliacao
          do Prestador, suspensao temporaria da Conta, encerramento permanente ou exclusao da
          Plataforma, sem prejuizo de eventuais responsabilidades civis.
        </p>
      </>
    ),
  },
  {
    id: 'avaliacoes',
    title: '9. Sistema de Avaliacoes',
    content: (
      <>
        <p>
          O sistema de avaliacoes constitui um pilar fundamental da Plataforma AgroConnect, destinado
          a promover a transparencia, a confianca e a qualidade dos servicos prestados. Apos a
          conclusao de cada transacao, ambas as partes (Cliente e Prestador) sao convidadas a avaliar
          a experiencia.
        </p>
        <p>
          A avaliacao e composta por uma classificacao numerica numa escala de 1 (uma) a 5 (cinco)
          estrelas e por um comentario textual opcional. A classificacao numerica e obrigatoria; o
          comentario, embora opcional, e fortemente encorajado para fornecer contexto util a outros
          utilizadores.
        </p>
        <p>
          As avaliacoes submetidas sao definitivas e nao podem ser removidas pelo Utilizador que as
          publicou. Esta politica destina-se a preservar a integridade e a fiabilidade do sistema de
          reputacao. No entanto, a Plataforma reserva-se o direito de moderar avaliacoes nas
          seguintes circunstancias:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Conteudo ofensivo, difamatorio, discriminatorio ou que viole a dignidade de terceiros.
          </li>
          <li>
            Linguagem obscena, ameacas ou incitamento a violencia.
          </li>
          <li>
            Informacoes comprovadamente falsas ou enganosas.
          </li>
          <li>
            Conteudo manifestamente irrelevante ou que nao diga respeito ao servico em causa.
          </li>
          <li>
            Avaliacoes feitas por contas fraudulentas ou que resultem de manipulacao coordenada.
          </li>
        </ul>
        <p>
          Os pedidos de moderacao de avaliacoes devem ser dirigidos a Plataforma atraves do endereco
          info@agroconnect.pt, acompanhados de fundamentacao. A Plataforma analisara cada caso
          individualmente e comunicara a sua decisao no prazo maximo de 10 (dez) dias uteis.
        </p>
        <p>
          A classificacao media de cada Utilizador e calculada com base em todas as avaliacoes
          recebidas e e exibida publicamente no respetivo perfil. Esta classificacao influencia a
          visibilidade do Utilizador na Plataforma e pode ser utilizada como criterio de ordenacao em
          pesquisas e listagens.
        </p>
      </>
    ),
  },
  {
    id: 'cancelamentos',
    title: '10. Cancelamentos e Reembolsos',
    content: (
      <>
        <p>
          A politica de cancelamentos da Plataforma AgroConnect visa equilibrar a protecao de ambas as
          partes envolvidas numa transacao, reconhecendo que circunstancias imprevistas podem exigir o
          cancelamento de um servico contratado.
        </p>
        <p>
          <strong>Cancelamento pelo Cliente antes da execucao:</strong> O Cliente pode cancelar um
          Pedido de Servico a qualquer momento antes do inicio da execucao do servico pelo Prestador.
          Neste caso, o valor total retido em Escrow sera integralmente devolvido ao Cliente, sem
          qualquer penalizacao ou deducao de comissao.
        </p>
        <p>
          <strong>Cancelamento pelo Cliente durante a execucao:</strong> Caso o Cliente solicite o
          cancelamento apos o Prestador ter iniciado a execucao do servico (confirmado por check-in
          GPS), a Plataforma procedera a uma avaliacao caso a caso. Podera ser aplicado um reembolso
          parcial, proporcional ao trabalho nao executado, deduzida a comissao da Plataforma sobre o
          valor retido. O Prestador recebera uma compensacao correspondente ao trabalho efetivamente
          realizado.
        </p>
        <p>
          <strong>Cancelamento pelo Prestador:</strong> O cancelamento de um servico pelo Prestador
          apos a aceitacao da Proposta constitui um incumprimento contratual. O Cliente recebera o
          reembolso integral do valor retido em Escrow. O Prestador podera sofrer as seguintes
          penalizacoes:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Registo do cancelamento no seu historico, visivel na Plataforma.</li>
          <li>Reducao da visibilidade do seu perfil nas pesquisas.</li>
          <li>Em caso de cancelamentos reiterados, suspensao temporaria ou permanente da Conta.</li>
        </ul>
        <p>
          <strong>Cancelamento pela Plataforma:</strong> A AgroConnect reserva-se o direito de
          cancelar transacoes em curso caso detete atividade fraudulenta, violacao dos presentes
          Termos ou circunstancias que comprometam a seguranca dos Utilizadores. Nestas situacoes, a
          Plataforma determinara a afetacao dos fundos retidos em Escrow de forma justa e
          fundamentada.
        </p>
        <p>
          Os reembolsos serao processados para o metodo de pagamento original num prazo maximo de 10
          (dez) dias uteis apos a aprovacao do cancelamento. A Plataforma nao sera responsavel por
          atrasos imputaveis a entidades financeiras terceiras.
        </p>
      </>
    ),
  },
  {
    id: 'disputas',
    title: '11. Disputas',
    content: (
      <>
        <p>
          A Plataforma AgroConnect disponibiliza um mecanismo de resolucao de disputas destinado a
          resolver desacordos entre Clientes e Prestadores relativamente a qualidade, conclusao ou
          condicoes de um servico contratado.
        </p>
        <p>
          <strong>Abertura de disputa:</strong> O Cliente pode abrir uma disputa no prazo de 72
          (setenta e duas) horas apos a conclusao declarada do servico pelo Prestador. A disputa deve
          ser fundamentada, descrevendo em detalhe os motivos de insatisfacao e, sempre que possivel,
          acompanhada de evidencias (fotografias, mensagens trocadas, registos de comunicacao).
        </p>
        <p>
          <strong>Processo de analise:</strong> Apos a abertura da disputa, a Plataforma notificara o
          Prestador, que dispora de 48 (quarenta e oito) horas para apresentar a sua versao dos
          factos e eventuais provas. A Plataforma analisara toda a informacao disponivel, incluindo
          registos de check-in GPS, historico de comunicacoes na Plataforma, avaliacoes anteriores e
          quaisquer evidencias apresentadas por ambas as partes.
        </p>
        <p>
          <strong>Resolucao:</strong> A Plataforma emitira uma decisao fundamentada no prazo maximo
          de 15 (quinze) dias uteis apos a abertura da disputa. As possiveis resolucoes incluem:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Libertacao integral dos fundos ao Prestador:</strong> Caso a Plataforma considere
            que o servico foi executado em conformidade com o acordado.
          </li>
          <li>
            <strong>Reembolso parcial ao Cliente:</strong> Caso a Plataforma considere que o servico
            foi parcialmente executado ou executado com deficiencias, sendo determinada uma
            distribuicao equitativa dos fundos retidos.
          </li>
          <li>
            <strong>Reembolso integral ao Cliente:</strong> Caso a Plataforma considere que o servico
            nao foi executado ou foi executado de forma manifestamente inadequada.
          </li>
        </ul>
        <p>
          A decisao da Plataforma e vinculativa para ambas as partes no ambito da relacao contratual
          com a AgroConnect, sem prejuizo do recurso aos meios judiciais competentes. A Plataforma
          atua como mediadora e emite decisoes baseadas nas evidencias disponiveis e nos principios de
          boa-fe e equidade.
        </p>
        <p>
          A abertura de disputas de forma abusiva, recorrente ou infundada podera resultar em
          penalizacoes na Conta do Utilizador, incluindo suspensao temporaria ou permanente.
        </p>
      </>
    ),
  },
  {
    id: 'propriedade-intelectual',
    title: '12. Propriedade Intelectual',
    content: (
      <>
        <p>
          Todo o conteudo da Plataforma AgroConnect, incluindo, mas nao se limitando a, o codigo-fonte,
          o design grafico, a interface do utilizador, os logotipos, marcas, icones, textos
          informativos e a estrutura de base de dados, e propriedade exclusiva do projeto AgroConnect
          ou dos seus licenciadores e esta protegido pela legislacao portuguesa e europeia em materia
          de propriedade intelectual e direitos de autor.
        </p>
        <p>
          A utilizacao da Plataforma nao confere ao Utilizador qualquer direito de propriedade
          intelectual sobre o conteudo da mesma. E expressamente proibida a reproducao, distribuicao,
          modificacao, descompilacao, engenharia reversa ou qualquer forma de utilizacao do conteudo
          da Plataforma que exceda os limites da utilizacao normal como Utilizador registado.
        </p>
        <p>
          O conteudo gerado pelos Utilizadores na Plataforma &mdash; incluindo descricoes de servicos,
          fotografias, comentarios e avaliacoes &mdash; permanece propriedade dos respetivos autores.
          No entanto, ao publicar conteudo na Plataforma, o Utilizador concede a AgroConnect uma
          licenca nao exclusiva, gratuita, mundial e sublicenciavel para utilizar, reproduzir, adaptar
          e exibir esse conteudo no ambito do funcionamento e promocao da Plataforma.
        </p>
        <p>
          E estritamente proibido o uso de sistemas automatizados (bots, scrapers, crawlers ou
          ferramentas similares) para extrair, copiar ou recolher dados ou conteudo da Plataforma sem
          autorizacao previa e expressa por escrito da AgroConnect. A violacao desta disposicao podera
          resultar em acao judicial e no encerramento imediato da Conta do infrator.
        </p>
        <p>
          Quaisquer sugestoes, ideias ou comentarios fornecidos pelos Utilizadores relativamente ao
          funcionamento ou melhoria da Plataforma poderao ser livremente utilizados pela AgroConnect
          sem qualquer obrigacao de compensacao ou reconhecimento.
        </p>
      </>
    ),
  },
  {
    id: 'limitacao-responsabilidade',
    title: '13. Limitacao de Responsabilidade',
    content: (
      <>
        <p>
          A Plataforma AgroConnect atua exclusivamente como intermediaria digital entre Clientes e
          Prestadores de servicos agricolas. A AgroConnect nao e parte nos contratos de prestacao de
          servicos celebrados entre Utilizadores e nao assume qualquer responsabilidade pela qualidade,
          seguranca, legalidade ou adequacao dos servicos prestados.
        </p>
        <p>
          A AgroConnect nao garante que os servicos contratados atraves da Plataforma serao executados
          de forma satisfatoria, dentro do prazo acordado ou em conformidade com as expectativas do
          Cliente. A responsabilidade pela execucao do servico e integralmente do Prestador que o
          aceitou.
        </p>
        <p>
          A Plataforma nao sera responsavel por quaisquer danos diretos, indiretos, incidentais,
          consequenciais, especiais ou punitivos decorrentes da utilizacao ou impossibilidade de
          utilizacao da Plataforma, incluindo, mas nao se limitando a:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Perdas financeiras resultantes de servicos nao executados ou mal executados.</li>
          <li>Danos materiais causados a propriedade do Cliente durante a execucao de servicos.</li>
          <li>Lesoes corporais ocorridas no decurso da prestacao de servicos.</li>
          <li>Perda de dados, interrupcao de atividade ou lucros cessantes.</li>
          <li>Atos ou omissoes de Utilizadores ou terceiros.</li>
        </ul>
        <p>
          Sem prejuizo do disposto nos paragrafos anteriores, a responsabilidade total da AgroConnect
          perante qualquer Utilizador, por quaisquer reclamacoes relacionadas com a Plataforma, estara
          limitada ao montante das comissoes efetivamente cobradas a esse Utilizador nos 12 (doze)
          meses anteriores ao evento que originou a reclamacao.
        </p>
        <p>
          A Plataforma nao sera responsavel por qualquer falha ou atraso no cumprimento das suas
          obrigacoes decorrente de causas de forca maior, incluindo, mas nao se limitando a,
          catastrofes naturais, epidemias, pandemias, conflitos armados, atos de terrorismo, falhas
          de infraestrutura de telecomunicacoes, cortes de energia, acoes governamentais ou qualquer
          outra circunstancia fora do controlo razoavel da AgroConnect.
        </p>
        <p>
          Nenhuma disposicao dos presentes Termos limita ou exclui a responsabilidade da AgroConnect
          por danos causados por dolo ou culpa grave, na medida em que tal limitacao ou exclusao nao
          seja permitida pela legislacao aplicavel.
        </p>
      </>
    ),
  },
  {
    id: 'protecao-dados',
    title: '14. Protecao de Dados',
    content: (
      <>
        <p>
          A AgroConnect compromete-se a proteger os dados pessoais dos seus Utilizadores em
          conformidade com o Regulamento Geral sobre a Protecao de Dados (Regulamento (UE) 2016/679
          &mdash; RGPD), a Lei n.o 58/2019 de 8 de agosto (lei de execucao nacional do RGPD) e demais
          legislacao aplicavel em materia de protecao de dados pessoais.
        </p>
        <p>
          O tratamento de dados pessoais efetuado pela Plataforma esta descrito em detalhe na{' '}
          <strong>Politica de Privacidade</strong>, que constitui parte integrante dos presentes
          Termos e que o Utilizador declara ter lido e aceite aquando do registo. A Politica de
          Privacidade pode ser consultada a qualquer momento na Plataforma.
        </p>
        <p>
          Em conformidade com o RGPD, os Utilizadores gozam dos seguintes direitos relativamente aos
          seus dados pessoais:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Direito de acesso:</strong> obter confirmacao sobre se os seus dados estao a ser
            tratados e, em caso afirmativo, aceder aos mesmos.
          </li>
          <li>
            <strong>Direito de retificacao:</strong> solicitar a correcao de dados inexatos ou
            incompletos.
          </li>
          <li>
            <strong>Direito ao apagamento:</strong> solicitar a eliminacao dos seus dados pessoais,
            nas condicoes previstas na lei.
          </li>
          <li>
            <strong>Direito a limitacao do tratamento:</strong> solicitar a restricao do tratamento
            dos seus dados em determinadas circunstancias.
          </li>
          <li>
            <strong>Direito a portabilidade:</strong> receber os seus dados num formato estruturado,
            de uso corrente e de leitura automatica.
          </li>
          <li>
            <strong>Direito de oposicao:</strong> opor-se ao tratamento dos seus dados para
            determinadas finalidades, incluindo marketing direto.
          </li>
        </ul>
        <p>
          Para exercer qualquer um dos direitos acima referidos, o Utilizador devera contactar a
          Plataforma atraves do endereco info@agroconnect.pt. Os pedidos serao respondidos no prazo
          maximo de 30 (trinta) dias, podendo este prazo ser prorrogado em casos de especial
          complexidade, mediante comunicacao fundamentada ao Utilizador.
        </p>
        <p>
          Sem prejuizo dos direitos acima referidos, o Utilizador tem o direito de apresentar
          reclamacao junto da Comissao Nacional de Protecao de Dados (CNPD), a autoridade de controlo
          portuguesa para a protecao de dados pessoais.
        </p>
      </>
    ),
  },
  {
    id: 'alteracoes',
    title: '15. Alteracoes aos Termos',
    content: (
      <>
        <p>
          A AgroConnect reserva-se o direito de alterar, atualizar ou complementar os presentes Termos
          e Condicoes de Utilizacao a qualquer momento, sempre que tal se justifique por razoes
          legais, regulatorias, de seguranca ou de evolucao do servico prestado.
        </p>
        <p>
          Em caso de alteracao dos Termos, a Plataforma notificara os Utilizadores registados com uma
          antecedencia minima de 30 (trinta) dias relativamente a data de entrada em vigor das
          alteracoes. A notificacao sera efetuada atraves de dois canais: (a) comunicacao por correio
          eletronico para o endereco registado na Conta do Utilizador; e (b) notificacao na propria
          Plataforma, visivel apos o inicio de sessao.
        </p>
        <p>
          A notificacao incluira um resumo das principais alteracoes efetuadas, bem como uma ligacao
          para a versao integral dos novos Termos. A versao anterior dos Termos ficara disponivel para
          consulta durante um periodo minimo de 90 (noventa) dias apos a entrada em vigor da nova
          versao.
        </p>
        <p>
          A continuacao da utilizacao da Plataforma apos a entrada em vigor dos novos Termos sera
          interpretada como aceitacao tacita das alteracoes introduzidas. Caso o Utilizador nao
          concorde com os novos Termos, devera cessar a utilizacao da Plataforma e podera solicitar o
          encerramento da sua Conta e a eliminacao dos seus dados pessoais nos termos da Politica de
          Privacidade.
        </p>
        <p>
          Em caso de alteracoes substanciais que afetem significativamente os direitos ou obrigacoes
          dos Utilizadores, a Plataforma podera solicitar uma nova aceitacao expressa dos Termos
          atualizados antes de permitir a continuacao da utilizacao do servico.
        </p>
      </>
    ),
  },
  {
    id: 'lei-aplicavel',
    title: '16. Lei Aplicavel',
    content: (
      <>
        <p>
          Os presentes Termos e Condicoes de Utilizacao regem-se e sao interpretados em conformidade
          com a legislacao da Republica Portuguesa, sem prejuizo das normas de direito internacional
          privado que resultem aplicaveis e das disposicoes imperativas do direito da Uniao Europeia,
          nomeadamente em materia de protecao do consumidor e de protecao de dados pessoais.
        </p>
        <p>
          Para a resolucao de quaisquer litigios emergentes dos presentes Termos ou da utilizacao da
          Plataforma, as partes acordam a competencia exclusiva dos tribunais judiciais da comarca de
          Ponta Delgada, Regiao Autonoma dos Acores, Portugal, sem prejuizo do foro legalmente
          imperativo do domicilio do consumidor, quando aplicavel.
        </p>
        <p>
          Sem prejuizo do recurso aos tribunais judiciais, as partes comprometem-se a tentar resolver
          amigavelmente quaisquer divergencias antes de instaurar accao judicial. Os Utilizadores
          podem ainda recorrer aos mecanismos de resolucao alternativa de litigios (RAL) disponibilizados
          por entidades acreditadas em Portugal, incluindo a plataforma europeia de resolucao de
          litigios em linha (ODR), acessivel em{' '}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 underline hover:text-green-800"
          >
            https://ec.europa.eu/consumers/odr
          </a>.
        </p>
        <p>
          Caso qualquer disposicao dos presentes Termos seja considerada invalida, ilegal ou
          inexequivel por um tribunal competente, tal invalidade, ilegalidade ou inexequibilidade nao
          afetara as restantes disposicoes, que permanecerao em pleno vigor e efeito. A disposicao
          invalida sera substituida por uma disposicao valida que se aproxime o mais possivel do
          objetivo economico e juridico da disposicao original.
        </p>
        <p>
          A omissao ou atraso por parte da AgroConnect no exercicio de qualquer direito previsto nos
          presentes Termos nao constituira renuncia a esse direito, que podera ser exercido a qualquer
          momento.
        </p>
        <p>
          Os presentes Termos, juntamente com a Politica de Privacidade e quaisquer outros documentos
          neles referenciados, constituem o acordo integral entre o Utilizador e a AgroConnect
          relativamente a utilizacao da Plataforma, substituindo quaisquer acordos, entendimentos ou
          compromissos anteriores, escritos ou verbais, sobre a mesma materia.
        </p>
      </>
    ),
  },
];

export function Terms() {
  return (
    <>
      <SEOHead
        title="Termos de Serviço — AgroConnect"
        description="Termos e condições de utilização da plataforma AgroConnect."
        path="/terms"
      />
      <LegalPageLayout
        title="Termos e Condicoes de Utilizacao"
        lastUpdated="Ultima atualizacao: 21 de marco de 2026"
        toc={TOC_ITEMS}
        sections={SECTIONS}
      />
    </>
  );
}
