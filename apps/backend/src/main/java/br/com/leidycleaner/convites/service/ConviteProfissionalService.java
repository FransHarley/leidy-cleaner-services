package br.com.leidycleaner.convites.service;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.leidycleaner.atendimentos.entity.AtendimentoFaxina;
import br.com.leidycleaner.atendimentos.repository.AtendimentoFaxinaRepository;
import br.com.leidycleaner.convites.dto.AdminConviteMonitoramentoDto;
import br.com.leidycleaner.convites.dto.ConviteRespostaDto;
import br.com.leidycleaner.convites.dto.ConviteProfissionalDto;
import br.com.leidycleaner.convites.entity.ConviteProfissional;
import br.com.leidycleaner.convites.entity.StatusConvite;
import br.com.leidycleaner.convites.mapper.ConviteProfissionalMapper;
import br.com.leidycleaner.convites.repository.ConviteProfissionalRepository;
import br.com.leidycleaner.core.exception.BusinessException;
import br.com.leidycleaner.creditos.entity.CreditoSolicitacao;
import br.com.leidycleaner.creditos.service.CreditoSolicitacaoService;
import br.com.leidycleaner.pagamentos.entity.Pagamento;
import br.com.leidycleaner.pagamentos.entity.StatusPagamento;
import br.com.leidycleaner.pagamentos.repository.PagamentoRepository;
import br.com.leidycleaner.profissionais.repository.PerfilProfissionalRepository;
import br.com.leidycleaner.solicitacoes.entity.SolicitacaoFaxina;
import br.com.leidycleaner.solicitacoes.entity.SolicitacaoProfissionalSelecionado;
import br.com.leidycleaner.solicitacoes.entity.StatusSolicitacao;
import br.com.leidycleaner.solicitacoes.repository.SolicitacaoFaxinaRepository;

@Service
public class ConviteProfissionalService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ConviteProfissionalService.class);
    private static final int HORAS_PARA_EXPIRAR = 24;

    private final ConviteProfissionalRepository conviteProfissionalRepository;
    private final PerfilProfissionalRepository perfilProfissionalRepository;
    private final SolicitacaoFaxinaRepository solicitacaoFaxinaRepository;
    private final AtendimentoFaxinaRepository atendimentoFaxinaRepository;
    private final PagamentoRepository pagamentoRepository;
    private final CreditoSolicitacaoService creditoSolicitacaoService;
    private final ConviteSolicitacaoPagaService conviteSolicitacaoPagaService;
    private final Clock clock;

    public ConviteProfissionalService(
            ConviteProfissionalRepository conviteProfissionalRepository,
            PerfilProfissionalRepository perfilProfissionalRepository,
            SolicitacaoFaxinaRepository solicitacaoFaxinaRepository,
            AtendimentoFaxinaRepository atendimentoFaxinaRepository,
            PagamentoRepository pagamentoRepository,
            CreditoSolicitacaoService creditoSolicitacaoService,
            ConviteSolicitacaoPagaService conviteSolicitacaoPagaService
    ) {
        this.conviteProfissionalRepository = conviteProfissionalRepository;
        this.perfilProfissionalRepository = perfilProfissionalRepository;
        this.solicitacaoFaxinaRepository = solicitacaoFaxinaRepository;
        this.atendimentoFaxinaRepository = atendimentoFaxinaRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.creditoSolicitacaoService = creditoSolicitacaoService;
        this.conviteSolicitacaoPagaService = conviteSolicitacaoPagaService;
        this.clock = Clock.systemDefaultZone();
    }

    public List<ConviteProfissional> substituirConvitesDaSolicitacao(
            SolicitacaoFaxina solicitacao,
            List<SolicitacaoProfissionalSelecionado> selecionados
    ) {
        conviteProfissionalRepository.deleteBySolicitacaoId(solicitacao.getId());
        conviteProfissionalRepository.flush();

        OffsetDateTime enviadoEm = OffsetDateTime.now(clock);
        OffsetDateTime expiraEm = enviadoEm.plusHours(HORAS_PARA_EXPIRAR);
        List<ConviteProfissional> convites = selecionados.stream()
                .map(selecionado -> new ConviteProfissional(
                        solicitacao,
                        selecionado.getProfissional(),
                        enviadoEm,
                        expiraEm
                ))
                .toList();
        return conviteProfissionalRepository.saveAll(convites);
    }

    @Transactional
    public ConviteProfissional criarConviteParaSolicitacaoPaga(SolicitacaoFaxina solicitacao) {
        return conviteSolicitacaoPagaService.criarConviteParaSolicitacaoPaga(solicitacao);
    }

    @Transactional(readOnly = true)
    public List<ConviteProfissionalDto> listarMeus(Long usuarioId) {
        validarPerfilProfissional(usuarioId);
        return conviteProfissionalRepository.findByProfissionalUsuarioIdOrderByEnviadoEmDescIdDesc(usuarioId)
                .stream()
                .map(ConviteProfissionalMapper::paraDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ConviteProfissionalDto buscarMeu(Long usuarioId, Long conviteId) {
        validarPerfilProfissional(usuarioId);
        return conviteProfissionalRepository.findByIdAndProfissionalUsuarioId(conviteId, usuarioId)
                .map(ConviteProfissionalMapper::paraDto)
                .orElseThrow(() -> new BusinessException("CONVITE_NOT_FOUND", "Convite nao encontrado", HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<AdminConviteMonitoramentoDto> listarAdminMonitoramento(
            StatusConvite status,
            Long solicitacaoId,
            Long profissionalId,
            Long clienteId,
            OffsetDateTime expiraAntesDe,
            OffsetDateTime expiraDepoisDe,
            boolean somenteVencidos
    ) {
        return conviteProfissionalRepository.findAdminMonitoramento(
                status,
                solicitacaoId,
                profissionalId,
                clienteId,
                expiraAntesDe,
                expiraDepoisDe,
                somenteVencidos,
                OffsetDateTime.now(clock)
        );
    }

    @Transactional
    public ConviteRespostaDto aceitar(Long usuarioId, Long conviteId) {
        validarPerfilProfissional(usuarioId);
        Long solicitacaoId = conviteProfissionalRepository
                .findSolicitacaoIdByIdAndProfissionalUsuarioId(conviteId, usuarioId)
                .orElseThrow(() -> new BusinessException("CONVITE_NOT_FOUND", "Convite nao encontrado", HttpStatus.NOT_FOUND));
        SolicitacaoFaxina solicitacao = solicitacaoFaxinaRepository.findByIdForUpdate(solicitacaoId)
                .orElseThrow(() -> new BusinessException("SOLICITACAO_NOT_FOUND", "Solicitacao nao encontrada", HttpStatus.NOT_FOUND));
        ConviteProfissional convite = conviteProfissionalRepository
                .findByIdAndProfissionalUsuarioIdForUpdate(conviteId, usuarioId)
                .orElseThrow(() -> new BusinessException("CONVITE_NOT_FOUND", "Convite nao encontrado", HttpStatus.NOT_FOUND));

        validarConvitePertenceASolicitacao(convite, solicitacao);
        validarConviteRespondivel(convite);
        validarConviteNaoExpirado(convite);

        OffsetDateTime agora = OffsetDateTime.now(clock);
        if (solicitacao.getStatus() == StatusSolicitacao.PAGA_AGUARDANDO_ACEITE) {
            return aceitarConviteDeSolicitacaoPaga(solicitacao, convite, agora);
        }

        validarSolicitacaoAceitavel(solicitacao);
        validarAtendimentoAindaNaoCriado(solicitacao);
        convite.aceitar(agora);
        cancelarConvitesConcorrentes(solicitacao.getId(), convite.getId(), agora);
        solicitacao.marcarAceita();

        AtendimentoFaxina atendimento = atendimentoFaxinaRepository.save(
                new AtendimentoFaxina(solicitacao, convite.getProfissional())
        );

        return new ConviteRespostaDto(
                convite.getId(),
                convite.getStatus(),
                solicitacao.getId(),
                solicitacao.getStatus(),
                atendimento.getId(),
                atendimento.getStatus()
        );
    }

    private ConviteRespostaDto aceitarConviteDeSolicitacaoPaga(
            SolicitacaoFaxina solicitacao,
            ConviteProfissional convite,
            OffsetDateTime agora
    ) {
        validarSolicitacaoPagaAguardandoAceite(solicitacao);
        validarAtendimentoAindaNaoCriado(solicitacao);

        Pagamento pagamento = carregarPagamentoPagoSemAtendimentoParaSolicitacao(
                solicitacao,
                "Convite so pode ser aceito quando o pagamento da solicitacao estiver pago"
        );

        convite.aceitar(agora);
        cancelarConvitesConcorrentes(solicitacao.getId(), convite.getId(), agora);
        solicitacao.marcarAceita();

        AtendimentoFaxina atendimento = atendimentoFaxinaRepository.save(
                AtendimentoFaxina.criarConfirmadoParaSolicitacaoPaga(solicitacao, convite.getProfissional())
        );
        pagamento.vincularAtendimento(atendimento);

        return new ConviteRespostaDto(
                convite.getId(),
                convite.getStatus(),
                solicitacao.getId(),
                solicitacao.getStatus(),
                atendimento.getId(),
                atendimento.getStatus()
        );
    }

    private ConviteRespostaDto recusarConviteDeSolicitacaoPaga(
            SolicitacaoFaxina solicitacao,
            ConviteProfissional convite,
            OffsetDateTime agora
    ) {
        validarSolicitacaoPagaAguardandoAceite(solicitacao);
        validarAtendimentoAindaNaoCriado(solicitacao);
        Pagamento pagamento = carregarPagamentoPagoSemAtendimentoParaSolicitacao(
                solicitacao,
                "Convite so pode ser recusado quando o pagamento da solicitacao estiver pago"
        );

        convite.recusar(agora);
        solicitacao.marcarNaoAceitaCreditoGerado();
        CreditoSolicitacao creditoSolicitacao = creditoSolicitacaoService.gerarCreditoDisponivel(
                solicitacao,
                pagamento,
                "Credito de reposicao gerado por recusa da profissional selecionada"
        );
        registrarLogOperacionalCredito(convite, solicitacao, pagamento, creditoSolicitacao, "recusa da profissional");
        return respostaSemAtendimento(convite, solicitacao);
    }

    private void expirarConviteDeSolicitacaoPaga(
            SolicitacaoFaxina solicitacao,
            ConviteProfissional convite,
            OffsetDateTime agora
    ) {
        validarSolicitacaoPagaAguardandoAceite(solicitacao);
        validarAtendimentoAindaNaoCriado(solicitacao);
        Pagamento pagamento = carregarPagamentoPagoSemAtendimentoParaSolicitacao(
                solicitacao,
                "Convite so pode expirar gerando credito quando o pagamento da solicitacao estiver pago"
        );

        convite.expirar(agora);
        solicitacao.marcarNaoAceitaCreditoGerado();
        CreditoSolicitacao creditoSolicitacao = creditoSolicitacaoService.gerarCreditoDisponivel(
                solicitacao,
                pagamento,
                "Credito de reposicao gerado porque a profissional nao aceitou o convite dentro do prazo"
        );
        registrarLogOperacionalCredito(convite, solicitacao, pagamento, creditoSolicitacao, "expiracao do convite");
    }

    @Transactional
    public ConviteRespostaDto recusar(Long usuarioId, Long conviteId) {
        validarPerfilProfissional(usuarioId);
        Long solicitacaoId = conviteProfissionalRepository
                .findSolicitacaoIdByIdAndProfissionalUsuarioId(conviteId, usuarioId)
                .orElseThrow(() -> new BusinessException("CONVITE_NOT_FOUND", "Convite nao encontrado", HttpStatus.NOT_FOUND));
        SolicitacaoFaxina solicitacao = solicitacaoFaxinaRepository.findByIdForUpdate(solicitacaoId)
                .orElseThrow(() -> new BusinessException("SOLICITACAO_NOT_FOUND", "Solicitacao nao encontrada", HttpStatus.NOT_FOUND));
        ConviteProfissional convite = conviteProfissionalRepository
                .findByIdAndProfissionalUsuarioIdForUpdate(conviteId, usuarioId)
                .orElseThrow(() -> new BusinessException("CONVITE_NOT_FOUND", "Convite nao encontrado", HttpStatus.NOT_FOUND));

        validarConvitePertenceASolicitacao(convite, solicitacao);
        validarConviteRespondivel(convite);
        validarConviteNaoExpirado(convite);

        OffsetDateTime agora = OffsetDateTime.now(clock);
        if (solicitacao.getStatus() == StatusSolicitacao.PAGA_AGUARDANDO_ACEITE) {
            return recusarConviteDeSolicitacaoPaga(solicitacao, convite, agora);
        }

        convite.recusar(agora);
        return respostaSemAtendimento(convite, solicitacao);
    }

    @Transactional
    public boolean expirarConviteSeNecessario(Long conviteId) {
        return processarExpiracaoAutomatica(conviteId).processado();
    }

    @Transactional
    public ConviteExpiracaoResultado processarExpiracaoAutomatica(Long conviteId) {
        Long solicitacaoId = conviteProfissionalRepository.findSolicitacaoIdById(conviteId)
                .orElseThrow(() -> new BusinessException("CONVITE_NOT_FOUND", "Convite nao encontrado", HttpStatus.NOT_FOUND));
        SolicitacaoFaxina solicitacao = solicitacaoFaxinaRepository.findByIdForUpdate(solicitacaoId)
                .orElseThrow(() -> new BusinessException("SOLICITACAO_NOT_FOUND", "Solicitacao nao encontrada", HttpStatus.NOT_FOUND));
        ConviteProfissional convite = conviteProfissionalRepository.findByIdForUpdate(conviteId)
                .orElseThrow(() -> new BusinessException("CONVITE_NOT_FOUND", "Convite nao encontrado", HttpStatus.NOT_FOUND));

        validarConvitePertenceASolicitacao(convite, solicitacao);

        OffsetDateTime agora = OffsetDateTime.now(clock);
        Long pagamentoId = buscarPagamentoIdSeExistir(solicitacao.getId());
        if (!convite.expiradoEm(agora)) {
            return ConviteExpiracaoResultado.ignorado(
                    convite.getId(),
                    solicitacao.getId(),
                    convite.getProfissional().getId(),
                    pagamentoId,
                    convite.getStatus(),
                    solicitacao.getStatus(),
                    "CONVITE_NAO_EXPIRADO"
            );
        }

        if (!convite.podeResponder()) {
            return ConviteExpiracaoResultado.ignorado(
                    convite.getId(),
                    solicitacao.getId(),
                    convite.getProfissional().getId(),
                    pagamentoId,
                    convite.getStatus(),
                    solicitacao.getStatus(),
                    "CONVITE_STATUS_" + convite.getStatus().name()
            );
        }

        if (solicitacao.getStatus() == StatusSolicitacao.PAGA_AGUARDANDO_ACEITE) {
            expirarConviteDeSolicitacaoPaga(solicitacao, convite, agora);
            return ConviteExpiracaoResultado.processado(
                    convite.getId(),
                    solicitacao.getId(),
                    convite.getProfissional().getId(),
                    pagamentoId,
                    true,
                    convite.getStatus(),
                    solicitacao.getStatus(),
                    "CONVITE_PAGO_EXPIRADO_COM_CREDITO"
            );
        }

        convite.expirar(agora);
        return ConviteExpiracaoResultado.processado(
                convite.getId(),
                solicitacao.getId(),
                convite.getProfissional().getId(),
                pagamentoId,
                false,
                convite.getStatus(),
                solicitacao.getStatus(),
                "CONVITE_LEGADO_EXPIRADO"
        );
    }

    private void validarPerfilProfissional(Long usuarioId) {
        if (perfilProfissionalRepository.findByUsuarioId(usuarioId).isEmpty()) {
            throw new AccessDeniedException("Usuario autenticado nao possui perfil profissional");
        }
    }

    private void validarConvitePertenceASolicitacao(ConviteProfissional convite, SolicitacaoFaxina solicitacao) {
        if (!convite.getSolicitacao().getId().equals(solicitacao.getId())) {
            throw new BusinessException("CONVITE_SOLICITACAO_INVALIDA", "Convite nao pertence a solicitacao bloqueada", HttpStatus.CONFLICT);
        }
    }

    private void validarConviteRespondivel(ConviteProfissional convite) {
        if (!convite.podeResponder()) {
            throw new BusinessException("CONVITE_STATUS_INCOMPATIVEL", "Convite nao esta disponivel para resposta", HttpStatus.CONFLICT);
        }
    }

    private void validarConviteNaoExpirado(ConviteProfissional convite) {
        OffsetDateTime agora = OffsetDateTime.now(clock);
        if (convite.expiradoEm(agora)) {
            throw new BusinessException("CONVITE_EXPIRADO", "Convite expirado", HttpStatus.CONFLICT);
        }
    }

    private void validarSolicitacaoAceitavel(SolicitacaoFaxina solicitacao) {
        if (solicitacao.getStatus() != StatusSolicitacao.CONVITES_ENVIADOS
                && solicitacao.getStatus() != StatusSolicitacao.AGUARDANDO_ACEITE) {
            throw new BusinessException("SOLICITACAO_STATUS_INCOMPATIVEL", "Solicitacao nao esta aberta para aceite", HttpStatus.CONFLICT);
        }
    }

    private void validarSolicitacaoPagaAguardandoAceite(SolicitacaoFaxina solicitacao) {
        if (solicitacao.getStatus() != StatusSolicitacao.PAGA_AGUARDANDO_ACEITE) {
            throw new BusinessException(
                    "SOLICITACAO_STATUS_INCOMPATIVEL",
                    "Solicitacao nao esta aguardando aceite apos pagamento confirmado",
                    HttpStatus.CONFLICT
            );
        }
    }

    private Pagamento carregarPagamentoPagoSemAtendimentoParaSolicitacao(
            SolicitacaoFaxina solicitacao,
            String mensagemPagamentoNaoPago
    ) {
        Pagamento pagamento = pagamentoRepository.findBySolicitacaoIdForUpdate(solicitacao.getId())
                .orElseThrow(() -> new BusinessException(
                        "PAGAMENTO_NOT_FOUND",
                        "Solicitacao paga nao possui pagamento vinculado",
                        HttpStatus.CONFLICT
                ));
        if (pagamento.getStatus() != StatusPagamento.PAGO) {
            throw new BusinessException(
                    "PAGAMENTO_STATUS_INCOMPATIVEL",
                    mensagemPagamentoNaoPago,
                    HttpStatus.CONFLICT
            );
        }
        if (pagamento.getAtendimento() != null) {
            throw new BusinessException(
                    "PAGAMENTO_JA_VINCULADO_A_ATENDIMENTO",
                    "Pagamento da solicitacao ja esta vinculado a um atendimento",
                    HttpStatus.CONFLICT
            );
        }
        return pagamento;
    }

    private void validarAtendimentoAindaNaoCriado(SolicitacaoFaxina solicitacao) {
        if (atendimentoFaxinaRepository.existsBySolicitacaoId(solicitacao.getId())) {
            throw new BusinessException("ATENDIMENTO_JA_CRIADO", "Solicitacao ja possui atendimento criado", HttpStatus.CONFLICT);
        }
    }

    private ConviteRespostaDto respostaSemAtendimento(ConviteProfissional convite, SolicitacaoFaxina solicitacao) {
        return new ConviteRespostaDto(
                convite.getId(),
                convite.getStatus(),
                solicitacao.getId(),
                solicitacao.getStatus(),
                null,
                null
        );
    }

    private Long buscarPagamentoIdSeExistir(Long solicitacaoId) {
        return pagamentoRepository.findBySolicitacaoId(solicitacaoId)
                .map(Pagamento::getId)
                .orElse(null);
    }

    private void registrarLogOperacionalCredito(
            ConviteProfissional convite,
            SolicitacaoFaxina solicitacao,
            Pagamento pagamento,
            CreditoSolicitacao creditoSolicitacao,
            String motivo
    ) {
        LOGGER.info(
                "credito_solicitacao_gerado motivo={} solicitacaoId={} pagamentoId={} clienteId={} conviteId={} creditoSolicitacaoId={} statusCredito={} tipoServico={} duracaoHoras={} regiaoId={} valorReferencia={} solicitacaoStatusFinal={}",
                motivo,
                solicitacao.getId(),
                pagamento.getId(),
                solicitacao.getCliente().getId(),
                convite.getId(),
                creditoSolicitacao.getId(),
                creditoSolicitacao.getStatus(),
                creditoSolicitacao.getTipoServico(),
                creditoSolicitacao.getDuracaoEstimadaHoras(),
                creditoSolicitacao.getRegiao().getId(),
                creditoSolicitacao.getValorReferencia(),
                solicitacao.getStatus()
        );
    }

    private void cancelarConvitesConcorrentes(Long solicitacaoId, Long conviteAceitoId, OffsetDateTime agora) {
        conviteProfissionalRepository.findBySolicitacaoId(solicitacaoId)
                .stream()
                .filter(outroConvite -> !outroConvite.getId().equals(conviteAceitoId))
                .forEach(outroConvite -> outroConvite.cancelar(agora));
    }
}
