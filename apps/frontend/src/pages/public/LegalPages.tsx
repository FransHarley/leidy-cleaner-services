import { Link } from 'react-router-dom';

function LegalDocumentLayout({
  title,
  subtitle,
  sections,
}: {
  title: string;
  subtitle: string;
  sections: Array<{ title: string; paragraphs: string[] }>;
}) {
  return (
    <main className="px-4 py-8 sm:px-5 md:px-8 md:py-14">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Documento publico</p>
          <h1 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl md:text-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">{subtitle}</p>

          <div className="mt-8 grid gap-8">
            {sections.map((section) => (
              <section key={section.title} className="grid gap-3">
                <h2 className="text-lg font-black text-slate-900 md:text-xl">{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-slate-600 md:text-base">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 text-sm font-bold sm:flex-row sm:flex-wrap">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-50 sm:w-auto" to="/cadastro/cliente">
              Cadastro de cliente
            </Link>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-50 sm:w-auto" to="/cadastro/profissional">
              Cadastro profissional
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export function TermsOfUsePage() {
  return (
    <LegalDocumentLayout
      title="Termos de Uso"
      subtitle="Este texto resume como a plataforma funciona no MVP e quais responsabilidades basicas clientes e profissionais assumem ao criar uma conta."
      sections={[
        {
          title: 'Finalidade da plataforma',
          paragraphs: [
            'A Leidy Cleaner Services conecta clientes a profissionais de limpeza para organizacao de solicitacoes, convites, atendimentos, pagamentos centralizados e acompanhamento operacional.',
            'A plataforma nao e um chat aberto nem uma rede social. Ela existe para intermediar a contratacao e registrar as etapas do servico com mais seguranca operacional.',
          ],
        },
        {
          title: 'Cadastro e informacoes',
          paragraphs: [
            'Cada pessoa deve informar dados verdadeiros, atualizados e de propria titularidade, incluindo nome, CPF, email, telefone e endereco quando aplicavel.',
            'Uma conta pode ser bloqueada ou recusada se houver informacoes falsas, tentativa de fraude, duplicidade indevida ou uso fora das regras da plataforma.',
          ],
        },
        {
          title: 'Contratacao, pagamento e ocorrencias',
          paragraphs: [
            'Os pagamentos do servico devem seguir o fluxo da plataforma. Tentativas de burlar esse fluxo podem gerar cancelamento, bloqueio ou analise administrativa.',
            'Cancelamentos, divergencias operacionais e problemas no atendimento podem ser registrados pelo canal de ocorrencias para analise da equipe administrativa.',
          ],
        },
        {
          title: 'Uso indevido e sancoes',
          paragraphs: [
            'Nao e permitido assediar, ameacar, discriminar, constranger, mentir em registros operacionais ou usar a plataforma para atividade ilegal ou abusiva.',
            'A plataforma pode aplicar advertencia, suspensao, bloqueio de conta, cancelamento de atendimento e, quando necessario, compartilhar informacoes com autoridades competentes.',
          ],
        },
      ]}
    />
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalDocumentLayout
      title="Politica de Privacidade e Tratamento de Dados"
      subtitle="Este resumo explica quais dados o MVP utiliza, para que eles sao usados e como isso se conecta a verificacao, seguranca e operacao da plataforma."
      sections={[
        {
          title: 'Quais dados coletamos',
          paragraphs: [
            'Podemos tratar nome, CPF, email, telefone, endereco, dados do perfil profissional, documentos, selfie, comprovante de residencia, registros de atendimento, ocorrencias e status operacionais ligados ao uso da plataforma.',
            'Tambem podem existir registros tecnicos basicos de acesso e aceite, como data e hora do cadastro, token de sessao e versao dos documentos aceitos.',
          ],
        },
        {
          title: 'Para que usamos os dados',
          paragraphs: [
            'Usamos os dados para criar contas, validar identidade, organizar solicitacoes, fazer matching por regiao e disponibilidade, registrar atendimentos, aumentar a seguranca operacional e apoiar suporte administrativo.',
            'Esses dados tambem podem ser usados para prevencao de fraude, cumprimento de obrigacoes legais e investigacao de uso indevido da plataforma.',
          ],
        },
        {
          title: 'Compartilhamento e retencao',
          paragraphs: [
            'Os dados podem ser compartilhados com prestadores tecnicos necessarios para o funcionamento do servico, com o gateway de pagamento e com a equipe administrativa responsavel pela operacao.',
            'Os dados sao mantidos pelo tempo necessario para operar a plataforma, cumprir obrigacoes legais, investigar ocorrencias e defender direitos da empresa e dos usuarios quando necessario.',
          ],
        },
        {
          title: 'Direitos e contato',
          paragraphs: [
            'O titular pode solicitar esclarecimentos sobre dados pessoais, atualizacao de informacoes e orientacoes sobre o tratamento realizado pela plataforma, respeitando limites legais e operacionais.',
            'Pedidos relacionados a dados e seguranca podem ser enviados pelos canais oficiais de suporte informados pela empresa.',
          ],
        },
      ]}
    />
  );
}

export function CodeOfConductPage() {
  return (
    <LegalDocumentLayout
      title="Codigo de Conduta"
      subtitle="Este documento define regras minimas de respeito, seguranca e uso responsavel da plataforma para clientes, profissionais e equipe operacional."
      sections={[
        {
          title: 'Regras para clientes',
          paragraphs: [
            'Clientes devem tratar profissionais com respeito, sem assedio moral ou sexual, ameacas, humilhacao, discriminacao ou exigencia de tarefas fora do combinado.',
            'Tambem devem fornecer informacoes corretas sobre o local, manter ambiente minimamente seguro e usar o canal de ocorrencias com responsabilidade.',
          ],
        },
        {
          title: 'Regras para profissionais',
          paragraphs: [
            'Profissionais devem tratar clientes com respeito, cumprir horarios, preservar privacidade, nao divulgar dados do cliente e nao agir com ameaca, assedio, furto ou dano intencional.',
            'Problemas operacionais, risco no local e divergencias devem ser registrados pelos canais adequados da plataforma para analise administrativa.',
          ],
        },
        {
          title: 'Seguranca operacional',
          paragraphs: [
            'A plataforma reconhece que pode haver risco para qualquer lado da relacao. Por isso, registros de verificacao, aceite, atendimento e ocorrencia fazem parte da base minima de seguranca do MVP.',
            'Violacoes graves podem levar a cancelamento do atendimento, bloqueio da conta, revisao administrativa e eventual comunicacao a autoridades quando for necessario.',
          ],
        },
      ]}
    />
  );
}
