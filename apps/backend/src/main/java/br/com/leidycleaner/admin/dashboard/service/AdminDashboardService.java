package br.com.leidycleaner.admin.dashboard.service;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.leidycleaner.admin.dashboard.dto.AdminDashboardIndicadoresDto;
import br.com.leidycleaner.atendimentos.entity.StatusAtendimento;
import br.com.leidycleaner.atendimentos.repository.AtendimentoFaxinaRepository;
import br.com.leidycleaner.convites.entity.StatusConvite;
import br.com.leidycleaner.convites.repository.ConviteProfissionalRepository;
import br.com.leidycleaner.creditos.entity.StatusCreditoSolicitacao;
import br.com.leidycleaner.creditos.repository.CreditoSolicitacaoRepository;
import br.com.leidycleaner.ocorrencias.entity.StatusOcorrencia;
import br.com.leidycleaner.ocorrencias.repository.OcorrenciaAtendimentoRepository;
import br.com.leidycleaner.pagamentos.entity.GatewayPagamento;
import br.com.leidycleaner.pagamentos.entity.MetodoPagamento;
import br.com.leidycleaner.pagamentos.entity.StatusPagamento;
import br.com.leidycleaner.pagamentos.repository.PagamentoRepository;
import br.com.leidycleaner.profissionais.entity.StatusAprovacaoProfissional;
import br.com.leidycleaner.profissionais.repository.PerfilProfissionalRepository;
import br.com.leidycleaner.solicitacoes.entity.StatusSolicitacao;
import br.com.leidycleaner.solicitacoes.repository.SolicitacaoFaxinaRepository;
import br.com.leidycleaner.usuarios.repository.UsuarioRepository;
import br.com.leidycleaner.verificacao.entity.StatusVerificacao;
import br.com.leidycleaner.verificacao.repository.DocumentoVerificacaoRepository;

@Service
public class AdminDashboardService {

    private static final List<StatusVerificacao> VERIFICACOES_PENDENTES = List.of(
            StatusVerificacao.PENDENTE,
            StatusVerificacao.EM_ANALISE
    );

    private static final List<StatusAprovacaoProfissional> PROFISSIONAIS_PENDENTES = List.of(
            StatusAprovacaoProfissional.PENDENTE,
            StatusAprovacaoProfissional.EM_ANALISE
    );

    private static final List<StatusSolicitacao> SOLICITACOES_ABERTAS = List.of(
            StatusSolicitacao.CRIADA,
            StatusSolicitacao.AGUARDANDO_SELECAO,
            StatusSolicitacao.AGUARDANDO_PAGAMENTO,
            StatusSolicitacao.PAGA_AGUARDANDO_ACEITE,
            StatusSolicitacao.CONVITES_ENVIADOS,
            StatusSolicitacao.AGUARDANDO_ACEITE,
            StatusSolicitacao.ACEITA
    );

    private static final List<StatusConvite> CONVITES_RESPONDIVEIS = List.of(
            StatusConvite.ENVIADO,
            StatusConvite.VISUALIZADO
    );

    private final DocumentoVerificacaoRepository documentoVerificacaoRepository;
    private final PerfilProfissionalRepository perfilProfissionalRepository;
    private final OcorrenciaAtendimentoRepository ocorrenciaAtendimentoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final AtendimentoFaxinaRepository atendimentoFaxinaRepository;
    private final SolicitacaoFaxinaRepository solicitacaoFaxinaRepository;
    private final ConviteProfissionalRepository conviteProfissionalRepository;
    private final CreditoSolicitacaoRepository creditoSolicitacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final Clock clock;

    public AdminDashboardService(
            DocumentoVerificacaoRepository documentoVerificacaoRepository,
            PerfilProfissionalRepository perfilProfissionalRepository,
            OcorrenciaAtendimentoRepository ocorrenciaAtendimentoRepository,
            PagamentoRepository pagamentoRepository,
            AtendimentoFaxinaRepository atendimentoFaxinaRepository,
            SolicitacaoFaxinaRepository solicitacaoFaxinaRepository,
            ConviteProfissionalRepository conviteProfissionalRepository,
            CreditoSolicitacaoRepository creditoSolicitacaoRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.documentoVerificacaoRepository = documentoVerificacaoRepository;
        this.perfilProfissionalRepository = perfilProfissionalRepository;
        this.ocorrenciaAtendimentoRepository = ocorrenciaAtendimentoRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.atendimentoFaxinaRepository = atendimentoFaxinaRepository;
        this.solicitacaoFaxinaRepository = solicitacaoFaxinaRepository;
        this.conviteProfissionalRepository = conviteProfissionalRepository;
        this.creditoSolicitacaoRepository = creditoSolicitacaoRepository;
        this.usuarioRepository = usuarioRepository;
        this.clock = Clock.systemDefaultZone();
    }

    @Transactional(readOnly = true)
    public AdminDashboardIndicadoresDto buscarIndicadores() {
        OffsetDateTime agora = OffsetDateTime.now(clock);
        return new AdminDashboardIndicadoresDto(
                documentoVerificacaoRepository.countByStatusVerificacaoIn(VERIFICACOES_PENDENTES),
                perfilProfissionalRepository.countByStatusAprovacaoIn(PROFISSIONAIS_PENDENTES),
                ocorrenciaAtendimentoRepository.countByStatus(StatusOcorrencia.ABERTA),
                ocorrenciaAtendimentoRepository.countByStatus(StatusOcorrencia.EM_ANALISE),
                pagamentoRepository.countByStatus(StatusPagamento.PENDENTE),
                pagamentoRepository.countByStatus(StatusPagamento.AGUARDANDO_CONFIRMACAO),
                pagamentoRepository.countByStatus(StatusPagamento.FALHOU),
                atendimentoFaxinaRepository.countByStatus(StatusAtendimento.EM_ANALISE),
                solicitacaoFaxinaRepository.countByStatusIn(SOLICITACOES_ABERTAS),
                usuarioRepository.count(),
                solicitacaoFaxinaRepository.countByStatus(StatusSolicitacao.AGUARDANDO_PAGAMENTO),
                solicitacaoFaxinaRepository.countByStatus(StatusSolicitacao.PAGA_AGUARDANDO_ACEITE),
                conviteProfissionalRepository.countExpiredRespondable(CONVITES_RESPONDIVEIS, agora),
                creditoSolicitacaoRepository.countByStatus(StatusCreditoSolicitacao.DISPONIVEL),
                creditoSolicitacaoRepository.countByStatus(StatusCreditoSolicitacao.UTILIZADO),
                pagamentoRepository.countByGatewayAndMetodoPagamento(
                        GatewayPagamento.INTERNO,
                        MetodoPagamento.CREDITO_SOLICITACAO
                )
        );
    }
}
