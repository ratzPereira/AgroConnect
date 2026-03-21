import { useState, useEffect } from 'react';
import { AnimatedPage } from '@/components/AnimatedPage';

interface TocItem {
  id: string;
  label: string;
}

const TOC_ITEMS: TocItem[] = [
  { id: 'responsavel', label: '1. Responsavel pelo Tratamento' },
  { id: 'dados-recolhidos', label: '2. Dados Pessoais Recolhidos' },
  { id: 'base-legal', label: '3. Base Legal do Tratamento' },
  { id: 'finalidades', label: '4. Finalidades do Tratamento' },
  { id: 'partilha', label: '5. Partilha de Dados' },
  { id: 'transferencias', label: '6. Transferencias Internacionais' },
  { id: 'conservacao', label: '7. Prazo de Conservacao' },
  { id: 'direitos', label: '8. Direitos do Titular' },
  { id: 'cookies', label: '9. Cookies' },
  { id: 'seguranca', label: '10. Medidas de Seguranca' },
  { id: 'alteracoes', label: '11. Alteracoes a Politica' },
  { id: 'contacto', label: '12. Contacto' },
];

export function Privacy() {
  const [activeSection, setActiveSection] = useState('');
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    document.querySelectorAll('[data-section]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleTocClick = (id: string) => {
    setTocOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <AnimatedPage>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-neutral-900">
            Politica de Privacidade
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Ultima atualizacao: 21 de marco de 2026
          </p>
        </header>

        {/* Mobile TOC toggle */}
        <div className="mb-6 lg:hidden">
          <button
            type="button"
            onClick={() => setTocOpen(!tocOpen)}
            className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm"
          >
            Indice
            <svg
              className={`h-4 w-4 transition-transform ${tocOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {tocOpen && (
            <nav className="mt-2 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <ul className="space-y-2">
                {TOC_ITEMS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleTocClick(item.id)}
                      className={`block w-full text-left text-sm ${
                        activeSection === item.id
                          ? 'font-semibold text-green-700'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        <div className="flex gap-10">
          {/* Desktop sticky TOC */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <nav className="sticky top-20">
              <ul className="space-y-2 border-l border-neutral-200 pl-4">
                {TOC_ITEMS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleTocClick(item.id)}
                      className={`block w-full text-left text-sm transition-colors ${
                        activeSection === item.id
                          ? 'font-semibold text-green-700'
                          : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Content */}
          <article className="max-w-3xl leading-relaxed text-neutral-700">
            <p className="mb-8">
              A AgroConnect compromete-se a proteger a privacidade e os dados pessoais
              dos seus utilizadores, em conformidade com o Regulamento Geral sobre a
              Protecao de Dados (Regulamento (UE) 2016/679, doravante &ldquo;RGPD&rdquo;)
              e com a legislacao nacional aplicavel, nomeadamente a Lei n.o 58/2019, de 8
              de agosto. A presente Politica de Privacidade descreve de forma transparente
              quais os dados pessoais que recolhemos, como os tratamos, com que finalidade
              e quais os direitos que assistem aos titulares dos dados.
            </p>

            {/* Section 1 */}
            <section id="responsavel" data-section className="mb-10 scroll-mt-24">
              <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                1. Responsavel pelo Tratamento
              </h2>
              <div className="space-y-3">
                <p>
                  O responsavel pelo tratamento dos dados pessoais recolhidos atraves da
                  plataforma AgroConnect e a entidade gestora do projeto AgroConnect,
                  desenvolvido no ambito da Licenciatura em Engenharia Informatica (LEI)
                  da Universidade Aberta, Portugal.
                </p>
                <p>
                  A AgroConnect e uma plataforma digital que funciona como marketplace de
                  servicos agricolas, permitindo a ligacao entre clientes (agricultores e
                  proprietarios rurais) e prestadores de servicos agricolas na Regiao
                  Autonoma dos Acores. Enquanto responsavel pelo tratamento, a AgroConnect
                  determina as finalidades e os meios de tratamento dos dados pessoais
                  recolhidos na plataforma.
                </p>
                <p>
                  Para qualquer questao relacionada com a protecao de dados pessoais,
                  incluindo o exercicio dos seus direitos enquanto titular dos dados,
                  podera contactar-nos atraves dos seguintes meios:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Email para protecao de dados:</strong>{' '}
                    privacidade@agroconnect.pt
                  </li>
                  <li>
                    <strong>Morada:</strong> Rua do Comercio, 45, 2.o andar, 9500-064
                    Ponta Delgada, Ilha de Sao Miguel, Acores, Portugal
                  </li>
                </ul>
                <p>
                  Comprometemo-nos a responder a todas as solicitacoes relativas a
                  protecao de dados no prazo maximo de 30 dias uteis, em conformidade com
                  o artigo 12.o, n.o 3, do RGPD.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="dados-recolhidos" data-section className="mb-10 scroll-mt-24">
              <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                2. Dados Pessoais Recolhidos
              </h2>
              <div className="space-y-3">
                <p>
                  No ambito da utilizacao da plataforma AgroConnect, recolhemos e
                  tratamos diferentes categorias de dados pessoais, dependendo do tipo de
                  interacao e do perfil do utilizador. Recolhemos apenas os dados
                  estritamente necessarios para as finalidades descritas nesta politica,
                  em conformidade com o principio da minimizacao dos dados previsto no
                  artigo 5.o, n.o 1, alinea c), do RGPD.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  2.1. Dados de registo e identificacao
                </h3>
                <p>
                  Aquando do registo na plataforma, recolhemos os seguintes dados
                  obrigatorios:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Nome completo</li>
                  <li>Endereco de email</li>
                  <li>Numero de telefone</li>
                  <li>Palavra-passe (armazenada de forma encriptada)</li>
                  <li>Tipo de utilizador (cliente ou prestador de servicos)</li>
                  <li>
                    Para prestadores de servicos: Numero de Identificacao Fiscal (NIF),
                    necessario para fins de faturacao e cumprimento de obrigacoes fiscais
                  </li>
                </ul>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  2.2. Dados de perfil
                </h3>
                <p>
                  Apos o registo, o utilizador pode voluntariamente complementar o seu
                  perfil com informacoes adicionais:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Fotografia de perfil</li>
                  <li>Biografia ou descricao profissional</li>
                  <li>
                    Localizacao geografica (coordenadas GPS, freguesia, concelho e ilha)
                  </li>
                  <li>Raio de atuacao (para prestadores de servicos)</li>
                  <li>
                    Categorias de servicos oferecidos (para prestadores de servicos)
                  </li>
                </ul>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  2.3. Dados de utilizacao da plataforma
                </h3>
                <p>
                  Durante a utilizacao normal da plataforma, sao gerados e tratados os
                  seguintes dados:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Pedidos de servico criados (descricao, localizacao, area, datas)</li>
                  <li>Propostas submetidas e respetivos valores</li>
                  <li>Mensagens trocadas entre utilizadores no contexto de um servico</li>
                  <li>
                    Dados de transacoes financeiras (montantes, datas, estado do
                    pagamento)
                  </li>
                  <li>
                    Avaliacoes e comentarios deixados sobre servicos realizados
                  </li>
                  <li>Fotografias de documentacao da execucao de servicos</li>
                </ul>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  2.4. Dados tecnicos
                </h3>
                <p>
                  Recolhemos automaticamente dados tecnicos necessarios para o
                  funcionamento, seguranca e melhoria da plataforma:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Endereco IP</li>
                  <li>
                    Informacao do navegador (user-agent, versao, sistema operativo)
                  </li>
                  <li>Cookies essenciais e funcionais (ver seccao 9)</li>
                  <li>
                    Registos de acesso (logs), incluindo data, hora e acoes realizadas
                  </li>
                  <li>Informacao do dispositivo (tipo, resolucao de ecra)</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section id="base-legal" data-section className="mb-10 scroll-mt-24">
              <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                3. Base Legal do Tratamento
              </h2>
              <div className="space-y-3">
                <p>
                  O tratamento dos dados pessoais pela AgroConnect baseia-se nas
                  seguintes bases legais, previstas no artigo 6.o, n.o 1, do RGPD,
                  conforme a finalidade especifica de cada tratamento:
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  3.1. Consentimento (artigo 6.o, n.o 1, alinea a))
                </h3>
                <p>
                  O consentimento do utilizador e solicitado no momento do registo na
                  plataforma e constitui a base legal para o tratamento de dados no
                  contexto da criacao de conta, carregamento de fotografia de perfil,
                  utilizacao de cookies nao essenciais e envio de comunicacoes de
                  marketing (quando aplicavel). O consentimento e dado de forma livre,
                  especifica, informada e inequivoca, podendo ser retirado a qualquer
                  momento, sem que tal comprometa a licitude do tratamento efetuado
                  anteriormente, nos termos do artigo 7.o, n.o 3, do RGPD.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  3.2. Execucao de contrato (artigo 6.o, n.o 1, alinea b))
                </h3>
                <p>
                  O tratamento de dados e necessario para a execucao do contrato de
                  prestacao de servicos celebrado entre o utilizador e a AgroConnect,
                  nomeadamente para: criacao e gestao da conta de utilizador, publicacao
                  e gestao de pedidos de servico, submissao e avaliacao de propostas,
                  processamento de pagamentos atraves do sistema de escrow, facilitacao
                  da comunicacao entre clientes e prestadores, e gestao de disputas entre
                  as partes.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  3.3. Interesse legitimo (artigo 6.o, n.o 1, alinea f))
                </h3>
                <p>
                  Determinados tratamentos de dados baseiam-se nos interesses legitimos
                  da AgroConnect, desde que estes nao sejam sobrepostos pelos direitos e
                  liberdades fundamentais do titular dos dados. Estes interesses incluem:
                  garantia da seguranca da plataforma e prevencao de fraude, detecao e
                  prevencao de abusos e utilizacao indevida, melhoria da experiencia do
                  utilizador atraves da analise de padroes de utilizacao (de forma
                  agregada e anonimizada), e resolucao de disputas entre utilizadores.
                  Em conformidade com o principio da proporcionalidade, realizamos uma
                  avaliacao de impacto sobre a protecao de dados quando o tratamento
                  apresenta riscos elevados para os titulares.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  3.4. Obrigacao legal (artigo 6.o, n.o 1, alinea c))
                </h3>
                <p>
                  Determinados dados sao tratados por forca de obrigacoes legais a que a
                  AgroConnect esta sujeita, nomeadamente: conservacao de dados de
                  transacoes financeiras para fins fiscais e contabilisticos (Codigo do
                  IVA, Codigo do IRC e legislacao complementar), conservacao de dados
                  para cumprimento de obrigacoes perante a Autoridade Tributaria e
                  Aduaneira, e resposta a pedidos de informacao de autoridades judiciais
                  ou reguladoras competentes, quando legalmente exigido.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="finalidades" data-section className="mb-10 scroll-mt-24">
              <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                4. Finalidades do Tratamento
              </h2>
              <div className="space-y-3">
                <p>
                  Os dados pessoais recolhidos sao tratados para as seguintes
                  finalidades especificas, em estrita conformidade com o principio da
                  limitacao das finalidades previsto no artigo 5.o, n.o 1, alinea b), do
                  RGPD:
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  4.1. Prestacao do servico da plataforma
                </h3>
                <p>
                  O tratamento de dados e essencial para o funcionamento da plataforma
                  AgroConnect como marketplace de servicos agricolas, incluindo a gestao
                  de contas de utilizador, publicacao de pedidos de servico com
                  geolocalizacao, apresentacao de propostas de prestadores na area
                  geografica relevante, atribuicao de servicos e gestao do ciclo de vida
                  completo de cada pedido (desde a publicacao ate a avaliacao final).
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  4.2. Processamento de pagamentos
                </h3>
                <p>
                  Os dados financeiros sao tratados para permitir o processamento seguro
                  de pagamentos atraves do sistema de escrow integrado, o qual retam os
                  fundos ate a confirmacao da conclusao do servico. Este processamento e
                  efetuado em parceria com o Stripe, enquanto processador de pagamentos
                  certificado PCI-DSS, garantindo os mais elevados padroes de seguranca
                  no tratamento de dados de pagamento.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  4.3. Comunicacao entre utilizadores
                </h3>
                <p>
                  Os dados de contacto e as mensagens trocadas no contexto de um servico
                  sao tratados para facilitar a comunicacao direta entre clientes e
                  prestadores, necessaria para a correta execucao dos servicos
                  contratados.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  4.4. Notificacoes
                </h3>
                <p>
                  Os dados de contacto (email e, quando aplicavel, notificacoes push no
                  navegador) sao utilizados para enviar notificacoes transacionais
                  relativas ao estado dos pedidos, propostas recebidas, pagamentos
                  processados, mensagens recebidas e outras interacoes relevantes na
                  plataforma.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  4.5. Prevencao de fraude e seguranca
                </h3>
                <p>
                  Os dados tecnicos e de utilizacao sao tratados para garantir a
                  seguranca da plataforma, detetar e prevenir atividades fraudulentas,
                  proteger os utilizadores contra acessos nao autorizados e manter a
                  integridade do sistema. Isto inclui a monitorizacao de padroes de
                  acesso anomalos, a validacao de identidades e a prevencao de criacao de
                  contas falsas.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  4.6. Melhoria da plataforma e analise estatistica
                </h3>
                <p>
                  Dados de utilizacao anonimizados e agregados sao tratados para fins de
                  analise estatistica, com vista a melhoria continua da experiencia do
                  utilizador, otimizacao do desempenho da plataforma e desenvolvimento de
                  novas funcionalidades. Estes dados nao permitem a identificacao
                  individual de qualquer utilizador.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  4.7. Cumprimento de obrigacoes legais
                </h3>
                <p>
                  Determinados dados sao conservados e tratados para cumprimento de
                  obrigacoes legais e regulamentares, incluindo obrigacoes fiscais,
                  contabilisticas e de reporte a autoridades competentes, conforme
                  exigido pela legislacao portuguesa e europeia aplicavel.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="partilha" data-section className="mb-10 scroll-mt-24">
              <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                5. Partilha de Dados
              </h2>
              <div className="space-y-3">
                <p>
                  A AgroConnect nao vende, aluga ou comercializa os dados pessoais dos
                  seus utilizadores a terceiros. Contudo, no ambito do funcionamento
                  normal da plataforma, determinados dados podem ser partilhados com as
                  seguintes categorias de destinatarios, em conformidade com o principio
                  da minimizacao e apenas na medida estritamente necessaria:
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  5.1. Outros utilizadores da plataforma
                </h3>
                <p>
                  No contexto de um pedido de servico, determinados dados pessoais sao
                  partilhados entre o cliente e o prestador de servicos para permitir a
                  execucao do servico contratado. Estes dados incluem: nome, localizacao
                  aproximada (freguesia e concelho), classificacao media (rating),
                  e informacao de contacto necessaria para a coordenacao do servico.
                  A partilha e limitada ao contexto do servico e os dados nao devem ser
                  utilizados para outras finalidades.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  5.2. Processador de pagamentos (Stripe)
                </h3>
                <p>
                  Os dados necessarios para o processamento de pagamentos sao
                  transmitidos ao Stripe, Inc., que atua como processador de pagamentos.
                  O Stripe e certificado PCI-DSS Level 1 e trata os dados em
                  conformidade com a sua propria politica de privacidade e nos termos do
                  contrato de subprocessamento celebrado com a AgroConnect. Apenas os
                  dados estritamente necessarios para o processamento da transacao sao
                  partilhados (valor, identificacao do utilizador, dados de metodo de
                  pagamento).
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  5.3. Fornecedores de infraestrutura e alojamento
                </h3>
                <p>
                  Os dados sao armazenados em servidores operados por fornecedores de
                  infraestrutura cloud situados no Espaco Economico Europeu (EEE). Estes
                  fornecedores atuam como subprocessadores nos termos do artigo 28.o do
                  RGPD e estao vinculados por acordos de processamento de dados que
                  garantem niveis adequados de protecao.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  5.4. Autoridades competentes
                </h3>
                <p>
                  Os dados pessoais podem ser divulgados a autoridades judiciais,
                  fiscais, reguladoras ou outras entidades competentes quando tal seja
                  legalmente exigido, nomeadamente no ambito de investigacoes criminais,
                  processos judiciais, auditorias fiscais ou outros procedimentos legais.
                  A AgroConnect avaliara cada pedido individualmente e apenas divulgara
                  os dados estritamente necessarios e exigidos por lei.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="transferencias" data-section className="mb-10 scroll-mt-24">
              <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                6. Transferencias Internacionais
              </h2>
              <div className="space-y-3">
                <p>
                  A AgroConnect privilegia o tratamento e armazenamento de dados pessoais
                  dentro do Espaco Economico Europeu (EEE), onde o RGPD garante um nivel
                  uniforme e elevado de protecao de dados pessoais. A infraestrutura
                  principal da plataforma esta alojada em servidores localizados no EEE.
                </p>
                <p>
                  Contudo, a utilizacao do Stripe como processador de pagamentos implica
                  a transferencia de determinados dados pessoais para os Estados Unidos
                  da America, onde o Stripe, Inc. tem a sua sede. Esta transferencia e
                  efetuada ao abrigo de clausulas contratuais-tipo aprovadas pela
                  Comissao Europeia (Decisao de Execucao (UE) 2021/914), que garantem um
                  nivel de protecao dos dados pessoais essencialmente equivalente ao
                  proporcionado pelo RGPD, nos termos do artigo 46.o, n.o 2, alinea c),
                  do RGPD.
                </p>
                <p>
                  Adicionalmente, o Stripe esta certificado ao abrigo do EU-U.S. Data
                  Privacy Framework, reconhecido pela Comissao Europeia como
                  proporcionando um nivel adequado de protecao (Decisao de Adequacao de
                  10 de julho de 2023), nos termos do artigo 45.o do RGPD.
                </p>
                <p>
                  A AgroConnect nao efetua quaisquer outras transferencias de dados
                  pessoais para paises fora do EEE. Caso venha a ser necessario no
                  futuro, tais transferencias serao efetuadas apenas com fundamento num
                  dos mecanismos previstos no Capitulo V do RGPD, e os utilizadores serao
                  informados atraves de atualizacao desta Politica de Privacidade.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="conservacao" data-section className="mb-10 scroll-mt-24">
              <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                7. Prazo de Conservacao
              </h2>
              <div className="space-y-3">
                <p>
                  Os dados pessoais sao conservados apenas durante o periodo estritamente
                  necessario para as finalidades para que foram recolhidos, em
                  conformidade com o principio da limitacao da conservacao previsto no
                  artigo 5.o, n.o 1, alinea e), do RGPD. Os prazos de conservacao
                  aplicaveis sao os seguintes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Dados de conta e perfil:</strong> conservados durante a
                    vigencia da conta do utilizador, acrescidos de 5 (cinco) anos apos a
                    eliminacao da conta, por forca de obrigacoes fiscais e para resolucao
                    de eventuais disputas pendentes.
                  </li>
                  <li>
                    <strong>Dados de transacoes financeiras:</strong> conservados durante
                    10 (dez) anos apos a data da transacao, em conformidade com as
                    obrigacoes contabilisticas e fiscais previstas no Codigo Comercial
                    (artigo 40.o) e legislacao fiscal aplicavel.
                  </li>
                  <li>
                    <strong>Registos de acesso (logs):</strong> conservados durante 1 (um)
                    ano, para fins de seguranca, detecao de fraude e cumprimento de
                    obrigacoes legais relativas a conservacao de dados de trafego.
                  </li>
                  <li>
                    <strong>Mensagens entre utilizadores:</strong> conservadas durante a
                    vigencia da conta do utilizador. Apos a eliminacao da conta, as
                    mensagens sao anonimizadas (o remetente e substituido por
                    &ldquo;Utilizador eliminado&rdquo;), mantendo-se o conteudo para
                    referencia do outro participante.
                  </li>
                  <li>
                    <strong>Dados anonimizados para fins estatisticos:</strong>{' '}
                    conservados indefinidamente, uma vez que, apos o processo de
                    anonimizacao irreversivel, deixam de constituir dados pessoais na
                    acepcao do RGPD (Considerando 26).
                  </li>
                </ul>
                <p>
                  Findo o prazo de conservacao aplicavel, os dados pessoais sao eliminados
                  de forma segura ou irreversivelmente anonimizados, no prazo maximo de
                  30 dias apos o termino do periodo de conservacao.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="direitos" data-section className="mb-10 scroll-mt-24">
              <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                8. Direitos do Titular
              </h2>
              <div className="space-y-3">
                <p>
                  Nos termos do RGPD, enquanto titular dos dados, o utilizador goza dos
                  seguintes direitos relativamente aos seus dados pessoais:
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  8.1. Direito de acesso (artigo 15.o do RGPD)
                </h3>
                <p>
                  O titular tem o direito de obter confirmacao de que os seus dados
                  pessoais sao objeto de tratamento e, em caso afirmativo, de aceder a
                  esses dados e a informacoes adicionais sobre o tratamento, incluindo as
                  finalidades, as categorias de dados, os destinatarios, o prazo de
                  conservacao e a existencia de decisoes automatizadas.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  8.2. Direito de retificacao (artigo 16.o do RGPD)
                </h3>
                <p>
                  O titular tem o direito de obter a retificacao dos seus dados pessoais
                  inexatos e de completar dados incompletos, sem demora injustificada.
                  A maioria dos dados pode ser retificada diretamente pelo utilizador
                  atraves das definicoes do seu perfil na plataforma.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  8.3. Direito ao apagamento / Direito a ser esquecido (artigo 17.o do
                  RGPD)
                </h3>
                <p>
                  O titular tem o direito de solicitar o apagamento dos seus dados
                  pessoais, nos termos do artigo 17.o do RGPD, nomeadamente quando os
                  dados ja nao forem necessarios para as finalidades para que foram
                  recolhidos, quando o consentimento for retirado, ou quando o tratamento
                  for ilicito. Este direito nao e absoluto e pode ser limitado quando o
                  tratamento for necessario para o cumprimento de obrigacoes legais ou
                  para efeitos de declaracao, exercicio ou defesa de um direito num
                  processo judicial.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  8.4. Direito a limitacao do tratamento (artigo 18.o do RGPD)
                </h3>
                <p>
                  O titular tem o direito de obter a limitacao do tratamento nas
                  situacoes previstas no artigo 18.o, nomeadamente quando contestar a
                  exatidao dos dados, quando o tratamento for ilicito e o titular se
                  opuser ao apagamento, ou quando os dados ja nao forem necessarios mas
                  o titular os requerer para efeitos de declaracao, exercicio ou defesa
                  de direitos.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  8.5. Direito a portabilidade dos dados (artigo 20.o do RGPD)
                </h3>
                <p>
                  O titular tem o direito de receber os dados pessoais que lhe digam
                  respeito e que tenha fornecido a AgroConnect, num formato estruturado,
                  de uso corrente e de leitura automatica (JSON), e o direito de
                  transmitir esses dados a outro responsavel pelo tratamento, sem que a
                  AgroConnect o possa impedir. Este direito aplica-se aos dados tratados
                  com base no consentimento ou na execucao de contrato, e quando o
                  tratamento for realizado por meios automatizados.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  8.6. Direito de oposicao (artigo 21.o do RGPD)
                </h3>
                <p>
                  O titular tem o direito de se opor, a qualquer momento, ao tratamento
                  dos seus dados pessoais baseado em interesses legitimos (artigo 6.o,
                  n.o 1, alinea f)), incluindo a definicao de perfis baseada nessa
                  disposicao. A AgroConnect cessara o tratamento, salvo se apresentar
                  razoes imperiosas e legitimas que prevalecem sobre os interesses,
                  direitos e liberdades do titular.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  8.7. Como exercer os seus direitos
                </h3>
                <p>
                  Os direitos acima referidos podem ser exercidos atraves dos seguintes
                  meios:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Na plataforma:</strong> atraves de Perfil &rarr; Dados
                    Pessoais, onde podera consultar, editar, exportar ou solicitar a
                    eliminacao dos seus dados.
                  </li>
                  <li>
                    <strong>Por email:</strong> enviando o seu pedido para
                    privacidade@agroconnect.pt, identificando-se de forma clara e
                    especificando o direito que pretende exercer.
                  </li>
                </ul>
                <p>
                  A AgroConnect respondera a todos os pedidos no prazo maximo de 30 dias
                  a contar da rececao do pedido, nos termos do artigo 12.o, n.o 3, do
                  RGPD. Este prazo pode ser prorrogado por mais 60 dias, quando
                  necessario, tendo em conta a complexidade e o numero de pedidos,
                  sendo o titular informado dessa prorrogacao e dos motivos da mesma.
                </p>
                <p>
                  Se considerar que o tratamento dos seus dados pessoais viola o RGPD, o
                  titular tem o direito de apresentar reclamacao junto da Comissao
                  Nacional de Protecao de Dados (CNPD), a autoridade de controlo
                  competente em Portugal:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Website:</strong>{' '}
                    <a
                      href="https://www.cnpd.pt"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 underline hover:text-green-800"
                    >
                      www.cnpd.pt
                    </a>
                  </li>
                  <li>
                    <strong>Morada:</strong> Av. D. Carlos I, 134, 1.o, 1200-651 Lisboa
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 9 */}
            <section id="cookies" data-section className="mb-10 scroll-mt-24">
              <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                9. Cookies
              </h2>
              <div className="space-y-3">
                <p>
                  Os cookies sao pequenos ficheiros de texto armazenados no dispositivo
                  do utilizador (computador, tablet ou telemovel) quando este visita um
                  website. Os cookies permitem que o website reconheca o dispositivo do
                  utilizador e recorde determinadas informacoes sobre as suas
                  preferencias ou acoes anteriores.
                </p>
                <p>
                  A plataforma AgroConnect utiliza as seguintes categorias de cookies:
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  9.1. Cookies essenciais (estritamente necessarios)
                </h3>
                <p>
                  Estes cookies sao indispensaveis para o funcionamento da plataforma e
                  nao podem ser desativados. Incluem:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Token de sessao (JWT):</strong> armazenado de forma segura
                    para manter a sessao autenticada do utilizador, com validade de 15
                    minutos (access token) e 7 dias (refresh token).
                  </li>
                  <li>
                    <strong>Preferencias de idioma:</strong> registo da preferencia
                    linguistica do utilizador para garantir uma experiencia consistente.
                  </li>
                </ul>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  9.2. Cookies funcionais
                </h3>
                <p>
                  Estes cookies permitem melhorar a funcionalidade e personalizacao da
                  plataforma:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Consentimento de cookies:</strong> registo das preferencias de
                    cookies do utilizador, para nao solicitar novamente o consentimento.
                  </li>
                  <li>
                    <strong>Preferencias de interface:</strong> tema (claro/escuro),
                    estado de menus e outras preferencias visuais.
                  </li>
                </ul>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  9.3. Cookies analiticos (quando aplicavel)
                </h3>
                <p>
                  Caso sejam implementados no futuro, os cookies analiticos permitirao
                  recolher informacao agregada e anonimizada sobre a utilizacao da
                  plataforma, incluindo paginas visitadas, tempo de permanencia e
                  percurso de navegacao. Estes cookies so serao ativados com o
                  consentimento previo do utilizador e nao permitirao a identificacao
                  individual de qualquer pessoa.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  9.4. Banner de consentimento
                </h3>
                <p>
                  Na primeira visita a plataforma, e apresentado ao utilizador um banner
                  de consentimento de cookies que permite aceitar ou rejeitar cookies nao
                  essenciais, em conformidade com a Diretiva ePrivacy (Diretiva
                  2002/58/CE) e com o RGPD. O consentimento e granular, ou seja, o
                  utilizador pode aceitar ou rejeitar cada categoria individualmente.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  9.5. Como gerir cookies no navegador
                </h3>
                <p>
                  O utilizador pode, a qualquer momento, gerir ou eliminar cookies
                  atraves das definicoes do seu navegador. Chamamos a atencao para o facto
                  de que a desativacao de cookies essenciais podera impedir o normal
                  funcionamento da plataforma, incluindo a impossibilidade de manter a
                  sessao autenticada. As instrucoes para gestao de cookies variam
                  consoante o navegador utilizado (Chrome, Firefox, Safari, Edge) e
                  podem ser consultadas na seccao de ajuda do respetivo navegador.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="seguranca" data-section className="mb-10 scroll-mt-24">
              <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                10. Medidas de Seguranca
              </h2>
              <div className="space-y-3">
                <p>
                  A AgroConnect implementa medidas tecnicas e organizativas adequadas para
                  garantir um nivel de seguranca proporcional ao risco, em conformidade
                  com o artigo 32.o do RGPD. Estas medidas visam proteger os dados
                  pessoais contra o acesso nao autorizado, a alteracao, a divulgacao ou a
                  destruicao acidental ou ilicita.
                </p>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  10.1. Medidas tecnicas
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Encriptacao em transito:</strong> todas as comunicacoes entre
                    o navegador do utilizador e os servidores da AgroConnect sao
                    encriptadas atraves de HTTPS/TLS, garantindo a confidencialidade e
                    integridade dos dados transmitidos.
                  </li>
                  <li>
                    <strong>Hashing de palavras-passe:</strong> as palavras-passe dos
                    utilizadores sao armazenadas utilizando o algoritmo BCrypt com fator
                    de custo 12, impossibilitando a sua recuperacao em texto claro, mesmo
                    em caso de acesso nao autorizado a base de dados.
                  </li>
                  <li>
                    <strong>Controlo de acessos baseado em papeis (RBAC):</strong> o
                    sistema implementa um modelo de controlo de acessos granular com 5
                    papeis distintos (Administrador, Cliente, Gestor de Prestador, Lider
                    de Equipa, Operador), garantindo que cada utilizador acede apenas aos
                    dados e funcionalidades estritamente necessarios.
                  </li>
                  <li>
                    <strong>Tokens JWT com validade limitada:</strong> os tokens de
                    autenticacao (access tokens) tem uma validade de 15 minutos,
                    reduzindo significativamente o risco em caso de comprometimento de um
                    token. Os refresh tokens tem uma validade de 7 dias e sao
                    armazenados de forma segura.
                  </li>
                  <li>
                    <strong>Rate limiting:</strong> mecanismos de limitacao de taxa de
                    pedidos (via Redis) protegem contra ataques de forca bruta e de
                    negacao de servico (DoS).
                  </li>
                  <li>
                    <strong>Backups regulares:</strong> sao efetuados backups regulares da
                    base de dados, armazenados de forma encriptada em localizacao
                    geograficamente separada.
                  </li>
                </ul>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  10.2. Medidas de monitorizacao
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Monitorizacao continua:</strong> a infraestrutura e monitorizada
                    24/7 com Prometheus e Grafana, permitindo a detecao rapida de
                    anomalias, tentativas de intrusao e degradacao de desempenho.
                  </li>
                  <li>
                    <strong>Registos de auditoria:</strong> todas as acoes sensiveis
                    (autenticacao, alteracao de dados pessoais, transacoes financeiras)
                    sao registadas em logs de auditoria imutaveis.
                  </li>
                  <li>
                    <strong>Alertas de seguranca:</strong> sao configurados alertas
                    automaticos para eventos de seguranca relevantes, como multiplas
                    tentativas de autenticacao falhadas ou acessos a partir de
                    localizacoes incomuns.
                  </li>
                </ul>

                <h3 className="mt-4 font-semibold text-neutral-900">
                  10.3. Medidas organizativas
                </h3>
                <p>
                  Para alem das medidas tecnicas, a AgroConnect adota medidas
                  organizativas que incluem a aplicacao do principio do minimo privilegio
                  no acesso a dados, a sensibilizacao dos colaboradores para a protecao
                  de dados e a realizacao periodica de revisoes de seguranca e testes de
                  vulnerabilidade.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section id="alteracoes" data-section className="mb-10 scroll-mt-24">
              <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                11. Alteracoes a Politica
              </h2>
              <div className="space-y-3">
                <p>
                  A AgroConnect reserva-se o direito de atualizar ou modificar a presente
                  Politica de Privacidade a qualquer momento, de forma a refletir
                  alteracoes nas praticas de tratamento de dados, na legislacao aplicavel
                  ou nas funcionalidades da plataforma.
                </p>
                <p>
                  Sempre que sejam efetuadas alteracoes materiais a esta politica, a
                  AgroConnect comprometese a notificar os utilizadores com uma
                  antecedencia minima de 30 (trinta) dias antes da entrada em vigor das
                  alteracoes, atraves dos seguintes meios:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Envio de notificacao por email para o endereco associado a conta do
                    utilizador.
                  </li>
                  <li>
                    Apresentacao de notificacao visivel na plataforma (banner ou
                    notificacao in-app).
                  </li>
                </ul>
                <p>
                  A data da ultima atualizacao e sempre indicada no topo desta pagina. O
                  utilizador e encorajado a consultar regularmente esta Politica de
                  Privacidade para se manter informado sobre como os seus dados pessoais
                  sao protegidos.
                </p>
                <p>
                  A continuacao da utilizacao da plataforma apos a entrada em vigor das
                  alteracoes constitui aceitacao das mesmas. Se o utilizador nao
                  concordar com as alteracoes, devera cessar a utilizacao da plataforma e,
                  se desejar, solicitar a eliminacao da sua conta e dos seus dados
                  pessoais, nos termos da seccao 8.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section id="contacto" data-section className="mb-10 scroll-mt-24">
              <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                12. Contacto
              </h2>
              <div className="space-y-3">
                <p>
                  Para qualquer questao, pedido de informacao ou exercicio de direitos
                  relacionados com a protecao dos seus dados pessoais, o utilizador pode
                  contactar a AgroConnect atraves dos seguintes meios:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Email:</strong>{' '}
                    <a
                      href="mailto:privacidade@agroconnect.pt"
                      className="text-green-700 underline hover:text-green-800"
                    >
                      privacidade@agroconnect.pt
                    </a>
                  </li>
                  <li>
                    <strong>Morada:</strong> Rua do Comercio, 45, 2.o andar, 9500-064
                    Ponta Delgada, Ilha de Sao Miguel, Acores, Portugal
                  </li>
                  <li>
                    <strong>Telefone:</strong> +351 296 000 000
                  </li>
                </ul>
                <p>
                  Para reclamacoes sobre o tratamento de dados pessoais, o utilizador pode
                  tambem contactar a Comissao Nacional de Protecao de Dados (CNPD), a
                  autoridade de controlo portuguesa competente em materia de protecao de
                  dados:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Website:</strong>{' '}
                    <a
                      href="https://www.cnpd.pt"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 underline hover:text-green-800"
                    >
                      www.cnpd.pt
                    </a>
                  </li>
                  <li>
                    <strong>Morada:</strong> Av. D. Carlos I, 134, 1.o, 1200-651 Lisboa
                  </li>
                  <li>
                    <strong>Telefone:</strong> +351 213 928 400
                  </li>
                  <li>
                    <strong>Email:</strong>{' '}
                    <a
                      href="mailto:geral@cnpd.pt"
                      className="text-green-700 underline hover:text-green-800"
                    >
                      geral@cnpd.pt
                    </a>
                  </li>
                </ul>
                <p>
                  A AgroConnect esta empenhada em resolver quaisquer preocupacoes
                  relacionadas com a privacidade de forma rapida e transparente.
                  Encorajamos os utilizadores a contactar-nos em primeiro lugar, antes de
                  recorrer a CNPD, para que possamos resolver a situacao diretamente.
                </p>
              </div>
            </section>
          </article>
        </div>
      </div>
    </AnimatedPage>
  );
}
