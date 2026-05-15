package br.com.leidycleaner.creditos.service;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.leidycleaner.clientes.repository.PerfilClienteRepository;
import br.com.leidycleaner.convites.entity.ConviteProfissional;
import br.com.leidycleaner.convites.service.ConviteSolicitacaoPagaService;
import br.com.leidycleaner.core.exception.BusinessException;
import br.com.leidycleaner.creditos.dto.AdminCreditoSolicitacaoDetalheDto;
import br.com.leidycleaner.creditos.dto.AdminCreditoSolicitacaoListItemDto;
import br.com.leidycleaner.creditos.dto.AdminCreditoSolicitacaoPagamentoResumoDto;
import br.com.leidycleaner.creditos.dto.AdminCreditoSolicitacaoSolicitacaoResumoDto;
import br.com.leidycleaner.creditos.dto.CreditoSolicitacaoDto;
import br.com.leidycleaner.creditos.dto.UsoCreditoSolicitacaoDto;
import br.com.leidycleaner.creditos.entity.CreditoSolicitacao;
import br.com.leidycleaner.creditos.entity.StatusCreditoSolicitacao;
import br.com.leidycleaner.creditos.mapper.CreditoSolicitacaoMapper;
import br.com.leidycleaner.creditos.repository.CreditoSolicitacaoRepository;
import br.com.leidycleaner.pagamentos.entity.Pagamento;
import br.com.leidycleaner.pagamentos.repository.PagamentoRepository;
import br.com.leidycleaner.solicitacoes.entity.SolicitacaoFaxina;
import br.com.leidycleaner.solicitacoes.entity.StatusSolicitacao;
import br.com.leidycleaner.solicitacoes.entity.TipoServico;
import br.com.leidycleaner.solicitacoes.repository.SolicitacaoFaxinaRepository;
import br.com.leidycleaner.solicitacoes.repository.SolicitacaoProfissionalSelecionadoRepository;

@Service
public class CreditoSolicitacaoService {

    private static final Logger LOGGER = LoggerFactory.getLogger(CreditoSolicitacaoService.class);

    private final CreditoSolicitacaoRepository creditoSolicitacaoRepository;
    private final PerfilClienteRepository perfilClienteRepository;
    private final SolicitacaoFaxinaRepository solicitacaoFaxinaRepository;
    private final SolicitacaoProfissionalSelecionadoRepository selecionadoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final ConviteSolicitacaoPagaService conviteSolicitacaoPagaService;
    private final Clock clock;

    public CreditoSolicitacaoService(
            CreditoSolicitacaoRepository creditoSolicitacaoRepository,
            PerfilClienteRepository perfilClienteRepository,
            SolicitacaoFaxinaRepository solicitacaoFaxinaRepository,
            SolicitacaoProfissionalSelecionadoRepository selecionadoRepository,
            PagamentoRepository pagamentoRepository,
            ConviteSolicitacaoPagaService conviteSolicitacaoPagaService
    ) {
        this.creditoSolicitacaoRepository = creditoSolicitacaoRepository;
        this.perfilClienteRepository = perfilClienteRepository;
        this.solicitacaoFaxinaRepository = solicitacaoFaxinaRepository;
        this.selecionadoRepository = selecionadoRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.conviteSolicitacaoPagaService = conviteSolicitacaoPagaService;
        this.clock = Clock.systemDefaultZone();
    }

    @Transactional(readOnly = true)
    public List<CreditoSolicitacaoDto> listarMeus(Long usuarioId, StatusCreditoSolicitacao status) {
        validarPerfilCliente(usuarioId);
        return creditoSolicitacaoRepository.findByClienteUsuarioIdOrderByCriadoEmDescIdDesc(usuarioId, status)
                .stream()
                .map(CreditoSolicitacaoMapper::paraDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminCreditoSolicitacaoListItemDto> listarAdmin(
            StatusCreditoSolicitacao status,
            Long clienteId,
            Long solicitacaoOrigemId,
            Long solicitacaoUsoId,
            Long pagamentoOrigemId,
            TipoServico tipoServico,
            Long regiaoId,
            OffsetDateTime criadoDe,
            OffsetDateTime criadoAte
    ) {
        return creditoSolicitacaoRepository.findAdminList(
                        status,
                        clienteId,
                        solicitacaoOrigemId,
                        solicitacaoUsoId,
                        pagamentoOrigemId,
                        tipoServico,
                        regiaoId,
                        criadoDe,
                        criadoAte
                ).stream()
                .map(this::paraAdminListItemDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminCreditoSolicitacaoDetalheDto buscarAdminPorId(Long id) {
        return creditoSolicitacaoRepository.findAdminById(id)
                .map(this::paraAdminDetalheDto)
                .orElseThrow(() -> new BusinessException(
                        "CREDITO_SOLICITACAO_NOT_FOUND",
                        "Credito de solicitacao nao encontrado",
                        HttpStatus.NOT_FOUND
                ));
    }

    @Transactional
    public CreditoSolicitacao gerarCreditoDisponivel(
            SolicitacaoFaxina solicitacao,
            Pagamento pagamento,
            String observacao
    ) {
        if (pagamento.getSolicitacao() == null || !pagamento.getSolicitacao().getId().equals(solicitacao.getId())) {
            throw new BusinessException(
                    "PAGAMENTO_SOLICITACAO_INCOMPATIVEL",
                    "Pagamento informado nao pertence a solicitacao que gerou o credito",
                    HttpStatus.CONFLICT
            );
        }
        return creditoSolicitacaoRepository.findByPagamentoOrigemId(pagamento.getId())
                .orElseGet(() -> creditoSolicitacaoRepository.saveAndFlush(
                        CreditoSolicitacao.criarDisponivel(solicitacao, pagamento, observacao)
                ));
    }

    @Transactional
    public UsoCreditoSolicitacaoDto usarEmSolicitacao(Long usuarioId, Long creditoId, Long solicitacaoId) {
        validarPerfilCliente(usuarioId);

        CreditoSolicitacao credito = creditoSolicitacaoRepository.findByIdAndClienteUsuarioIdForUpdate(creditoId, usuarioId)
                .orElseThrow(() -> new BusinessException(
                        "CREDITO_SOLICITACAO_NOT_FOUND",
                        "Credito de solicitacao nao encontrado",
                        HttpStatus.NOT_FOUND
                ));
        SolicitacaoFaxina solicitacao = solicitacaoFaxinaRepository.findByIdForUpdate(solicitacaoId)
                .orElseThrow(() -> new BusinessException(
                        "SOLICITACAO_NOT_FOUND",
                        "Solicitacao nao encontrada",
                        HttpStatus.NOT_FOUND
                ));

        validarSolicitacaoDoCliente(usuarioId, solicitacao);
        validarCreditoDisponivel(credito);
        validarMesmoCliente(credito, solicitacao);
        validarSolicitacaoAguardandoPagamento(solicitacao);
        validarSolicitacaoComUmaProfissionalSelecionada(solicitacao);
        validarEquivalencia(credito, solicitacao);
        validarSolicitacaoSemPagamento(solicitacao);
        validarSolicitacaoSemOutroCreditoUtilizado(solicitacao);

        OffsetDateTime agora = OffsetDateTime.now(clock);
        credito.marcarUtilizado(solicitacao, agora);
        Pagamento pagamento = pagamentoRepository.saveAndFlush(
                Pagamento.criarPagoComCreditoSolicitacao(solicitacao, credito.getId(), agora)
        );
        ConviteProfissional convite = conviteSolicitacaoPagaService.criarConviteParaSolicitacaoPaga(solicitacao);

        LOGGER.info(
                "credito_solicitacao_utilizado creditoId={} clienteId={} solicitacaoOrigemId={} solicitacaoUsoId={} pagamentoId={} pagamentoGateway={} pagamentoMetodo={} conviteId={} solicitacaoStatusFinal={}",
                credito.getId(),
                credito.getCliente().getId(),
                credito.getSolicitacaoOrigem().getId(),
                solicitacao.getId(),
                pagamento.getId(),
                pagamento.getGateway(),
                pagamento.getMetodoPagamento(),
                convite.getId(),
                solicitacao.getStatus()
        );

        return new UsoCreditoSolicitacaoDto(
                credito.getId(),
                credito.getStatus(),
                solicitacao.getId(),
                solicitacao.getStatus(),
                pagamento.getId(),
                pagamento.getStatus(),
                convite.getId(),
                convite.getStatus()
        );
    }

    private void validarPerfilCliente(Long usuarioId) {
        if (perfilClienteRepository.findByUsuarioId(usuarioId).isEmpty()) {
            throw new AccessDeniedException("Usuario autenticado nao possui perfil cliente");
        }
    }

    private AdminCreditoSolicitacaoListItemDto paraAdminListItemDto(CreditoSolicitacao credito) {
        return new AdminCreditoSolicitacaoListItemDto(
                credito.getId(),
                credito.getStatus(),
                credito.getCliente().getId(),
                credito.getCliente().getUsuario().getNomeCompleto(),
                credito.getSolicitacaoOrigem().getId(),
                credito.getPagamentoOrigem().getId(),
                credito.getSolicitacaoUso() != null ? credito.getSolicitacaoUso().getId() : null,
                credito.getTipoServico(),
                credito.getDuracaoEstimadaHoras(),
                credito.getRegiao().getId(),
                credito.getRegiao().getNome(),
                credito.getValorReferencia(),
                credito.getCriadoEm(),
                credito.getReservadoEm(),
                credito.getUtilizadoEm(),
                credito.getCanceladoEm(),
                credito.getObservacao()
        );
    }

    private AdminCreditoSolicitacaoDetalheDto paraAdminDetalheDto(CreditoSolicitacao credito) {
        return new AdminCreditoSolicitacaoDetalheDto(
                credito.getId(),
                credito.getStatus(),
                credito.getCliente().getId(),
                credito.getCliente().getUsuario().getNomeCompleto(),
                credito.getSolicitacaoOrigem().getId(),
                credito.getPagamentoOrigem().getId(),
                credito.getSolicitacaoUso() != null ? credito.getSolicitacaoUso().getId() : null,
                credito.getTipoServico(),
                credito.getDuracaoEstimadaHoras(),
                credito.getRegiao().getId(),
                credito.getRegiao().getNome(),
                credito.getValorReferencia(),
                credito.getCriadoEm(),
                credito.getReservadoEm(),
                credito.getUtilizadoEm(),
                credito.getCanceladoEm(),
                credito.getObservacao(),
                paraSolicitacaoResumoDto(credito.getSolicitacaoOrigem()),
                paraPagamentoResumoDto(credito.getPagamentoOrigem()),
                credito.getSolicitacaoUso() != null ? paraSolicitacaoResumoDto(credito.getSolicitacaoUso()) : null
        );
    }

    private AdminCreditoSolicitacaoSolicitacaoResumoDto paraSolicitacaoResumoDto(SolicitacaoFaxina solicitacao) {
        return new AdminCreditoSolicitacaoSolicitacaoResumoDto(
                solicitacao.getId(),
                solicitacao.getStatus(),
                solicitacao.getCliente().getId(),
                solicitacao.getCliente().getUsuario().getNomeCompleto(),
                solicitacao.getDataHoraDesejada(),
                solicitacao.getTipoServico(),
                solicitacao.getDuracaoEstimadaHoras(),
                solicitacao.getRegiao().getId(),
                solicitacao.getRegiao().getNome()
        );
    }

    private AdminCreditoSolicitacaoPagamentoResumoDto paraPagamentoResumoDto(Pagamento pagamento) {
        return new AdminCreditoSolicitacaoPagamentoResumoDto(
                pagamento.getId(),
                pagamento.getGateway(),
                pagamento.getMetodoPagamento(),
                pagamento.getStatus(),
                pagamento.getGatewayPaymentId(),
                pagamento.getSolicitacao() != null ? pagamento.getSolicitacao().getId() : null,
                pagamento.getAtendimento() != null ? pagamento.getAtendimento().getId() : null,
                pagamento.getValorBruto(),
                pagamento.getValorLiquidoRecebido(),
                pagamento.getRecebidoEm(),
                pagamento.getCriadoEm()
        );
    }

    private void validarSolicitacaoDoCliente(Long usuarioId, SolicitacaoFaxina solicitacao) {
        if (!solicitacao.getCliente().getUsuario().getId().equals(usuarioId)) {
            throw new BusinessException(
                    "SOLICITACAO_NOT_FOUND",
                    "Solicitacao nao encontrada",
                    HttpStatus.NOT_FOUND
            );
        }
    }

    private void validarCreditoDisponivel(CreditoSolicitacao credito) {
        if (!credito.estaDisponivel()) {
            throw new BusinessException(
                    "CREDITO_SOLICITACAO_STATUS_INCOMPATIVEL",
                    "Credito de solicitacao nao esta disponivel para uso",
                    HttpStatus.CONFLICT
            );
        }
    }

    private void validarMesmoCliente(CreditoSolicitacao credito, SolicitacaoFaxina solicitacao) {
        if (!credito.getCliente().getId().equals(solicitacao.getCliente().getId())) {
            throw new BusinessException(
                    "CREDITO_SOLICITACAO_CLIENTE_INCOMPATIVEL",
                    "Credito de solicitacao nao pertence a cliente da solicitacao informada",
                    HttpStatus.CONFLICT
            );
        }
    }

    private void validarSolicitacaoAguardandoPagamento(SolicitacaoFaxina solicitacao) {
        if (solicitacao.getStatus() != StatusSolicitacao.AGUARDANDO_PAGAMENTO) {
            throw new BusinessException(
                    "SOLICITACAO_STATUS_INCOMPATIVEL",
                    "Solicitacao nao esta aguardando pagamento para usar credito",
                    HttpStatus.CONFLICT
            );
        }
    }

    private void validarSolicitacaoComUmaProfissionalSelecionada(SolicitacaoFaxina solicitacao) {
        if (selecionadoRepository.countBySolicitacaoId(solicitacao.getId()) != 1) {
            throw new BusinessException(
                    "SOLICITACAO_PROFISSIONAL_SELECIONADA_INVALIDA",
                    "Solicitacao deve ter exatamente uma profissional selecionada para usar credito",
                    HttpStatus.CONFLICT
            );
        }
    }

    private void validarEquivalencia(CreditoSolicitacao credito, SolicitacaoFaxina solicitacao) {
        if (!credito.equivaleASolicitacao(solicitacao)) {
            throw new BusinessException(
                    "CREDITO_SOLICITACAO_INCOMPATIVEL",
                    "Credito de solicitacao so pode ser usado em nova solicitacao equivalente por tipo de servico, duracao e regiao",
                    HttpStatus.CONFLICT
            );
        }
    }

    private void validarSolicitacaoSemPagamento(SolicitacaoFaxina solicitacao) {
        if (pagamentoRepository.findBySolicitacaoIdForUpdate(solicitacao.getId()).isPresent()) {
            throw new BusinessException(
                    "PAGAMENTO_JA_EXISTE",
                    "Solicitacao ja possui pagamento vinculado",
                    HttpStatus.CONFLICT
            );
        }
    }

    private void validarSolicitacaoSemOutroCreditoUtilizado(SolicitacaoFaxina solicitacao) {
        if (creditoSolicitacaoRepository.existsBySolicitacaoUsoId(solicitacao.getId())) {
            throw new BusinessException(
                    "CREDITO_SOLICITACAO_JA_UTILIZADO_NA_SOLICITACAO",
                    "Solicitacao ja possui credito de reposicao utilizado",
                    HttpStatus.CONFLICT
            );
        }
    }
}
