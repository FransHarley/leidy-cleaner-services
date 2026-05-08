package br.com.leidycleaner.pagamentos.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.leidycleaner.atendimentos.entity.AtendimentoFaxina;
import br.com.leidycleaner.atendimentos.entity.StatusAtendimento;
import br.com.leidycleaner.atendimentos.repository.AtendimentoFaxinaRepository;
import br.com.leidycleaner.atendimentos.service.AtendimentoExpiracaoService;
import br.com.leidycleaner.core.exception.BusinessException;
import br.com.leidycleaner.pagamentos.dto.CheckoutDto;
import br.com.leidycleaner.pagamentos.dto.CheckoutRequest;
import br.com.leidycleaner.pagamentos.dto.PagamentoDto;
import br.com.leidycleaner.pagamentos.dto.PagamentoRequest;
import br.com.leidycleaner.pagamentos.entity.GatewayPagamento;
import br.com.leidycleaner.pagamentos.entity.MetodoPagamento;
import br.com.leidycleaner.pagamentos.entity.Pagamento;
import br.com.leidycleaner.pagamentos.entity.StatusPagamento;
import br.com.leidycleaner.pagamentos.gateway.AsaasCheckoutGatewayResponse;
import br.com.leidycleaner.pagamentos.gateway.AsaasCheckoutRequest;
import br.com.leidycleaner.pagamentos.gateway.AsaasCobrancaRequest;
import br.com.leidycleaner.pagamentos.gateway.AsaasGatewayClient;
import br.com.leidycleaner.pagamentos.gateway.AsaasPagamentoGatewayResponse;
import br.com.leidycleaner.pagamentos.mapper.PagamentoMapper;
import br.com.leidycleaner.pagamentos.repository.PagamentoRepository;
import br.com.leidycleaner.usuarios.entity.TipoUsuario;
import br.com.leidycleaner.usuarios.repository.UsuarioRepository;

@Service
public class PagamentoService {

    private final PagamentoRepository pagamentoRepository;
    private final AtendimentoFaxinaRepository atendimentoFaxinaRepository;
    private final AsaasGatewayClient asaasGatewayClient;
    private final UsuarioRepository usuarioRepository;
    private final AtendimentoExpiracaoService atendimentoExpiracaoService;

    public PagamentoService(
            PagamentoRepository pagamentoRepository,
            AtendimentoFaxinaRepository atendimentoFaxinaRepository,
            AsaasGatewayClient asaasGatewayClient,
            UsuarioRepository usuarioRepository,
            AtendimentoExpiracaoService atendimentoExpiracaoService
    ) {
        this.pagamentoRepository = pagamentoRepository;
        this.atendimentoFaxinaRepository = atendimentoFaxinaRepository;
        this.asaasGatewayClient = asaasGatewayClient;
        this.usuarioRepository = usuarioRepository;
        this.atendimentoExpiracaoService = atendimentoExpiracaoService;
    }

    @Transactional
    @Deprecated(forRemoval = false)
    public PagamentoDto criar(Long usuarioId, PagamentoRequest request) {
        atendimentoExpiracaoService.expirarAtendimentosNaoPagosVencidos();
        AtendimentoFaxina atendimento = buscarAtendimentoDoCliente(usuarioId, request.atendimentoId());
        validarAtendimentoAguardandoPagamento(atendimento);
        if (pagamentoRepository.existsByAtendimentoId(atendimento.getId())) {
            throw new BusinessException("PAGAMENTO_JA_EXISTE", "Atendimento ja possui pagamento", HttpStatus.CONFLICT);
        }

        AsaasPagamentoGatewayResponse gatewayResponse = asaasGatewayClient.criarCobranca(new AsaasCobrancaRequest(
                atendimento.getId(),
                request.metodoPagamento(),
                atendimento.getValorServico(),
                "Leidy Cleaner Services - atendimento #" + atendimento.getId()
        ));
        validarUrlPagamentoGateway(gatewayResponse.urlPagamento());

        Pagamento pagamento = new Pagamento(
                atendimento,
                GatewayPagamento.ASAAS,
                gatewayResponse.gatewayPaymentId(),
                request.metodoPagamento(),
                paraStatusM5A(gatewayResponse.statusGateway()),
                atendimento.getValorServico(),
                gatewayResponse.urlPagamento(),
                gatewayResponse.pixCopiaECola(),
                gatewayResponse.payloadResumo()
        );
        return PagamentoMapper.paraDto(pagamentoRepository.save(pagamento));
    }

    @Transactional(readOnly = true)
    public PagamentoDto buscarPorId(Long usuarioId, Long pagamentoId) {
        atendimentoExpiracaoService.expirarAtendimentosNaoPagosVencidos();
        Pagamento pagamento = pagamentoRepository.findByIdWithAtendimentoCliente(pagamentoId)
                .orElseThrow(() -> new BusinessException("PAGAMENTO_NOT_FOUND", "Pagamento nao encontrado", HttpStatus.NOT_FOUND));
        validarClienteOuAdminDoPagamento(usuarioId, pagamento);
        return PagamentoMapper.paraDto(pagamento);
    }

    @Transactional(readOnly = true)
    public PagamentoDto buscarPorAtendimento(Long usuarioId, Long atendimentoId) {
        atendimentoExpiracaoService.expirarAtendimentosNaoPagosVencidos();
        Pagamento pagamento = pagamentoRepository.findByAtendimentoId(atendimentoId)
                .orElseThrow(() -> new BusinessException("PAGAMENTO_NOT_FOUND", "Pagamento nao encontrado", HttpStatus.NOT_FOUND));
        validarClienteOuAdminDoPagamento(usuarioId, pagamento);
        return PagamentoMapper.paraDto(pagamento);
    }

    @Transactional(readOnly = true)
    public List<PagamentoDto> listarAdmin(StatusPagamento status, MetodoPagamento metodoPagamento, Long atendimentoId) {
        atendimentoExpiracaoService.expirarAtendimentosNaoPagosVencidos();
        return pagamentoRepository.findAdminList(status, metodoPagamento, atendimentoId)
                .stream()
                .map(PagamentoMapper::paraDto)
                .toList();
    }

    @Transactional
    public PagamentoDto consultarStatus(Long usuarioId, Long pagamentoId) {
        atendimentoExpiracaoService.expirarAtendimentosNaoPagosVencidos();
        Pagamento pagamento = pagamentoRepository.findByIdWithAtendimentoCliente(pagamentoId)
                .orElseThrow(() -> new BusinessException("PAGAMENTO_NOT_FOUND", "Pagamento nao encontrado", HttpStatus.NOT_FOUND));
        validarClienteDoPagamento(usuarioId, pagamento);
        if (pagamento.getAtendimento().getStatus() == StatusAtendimento.CANCELADO
                && pagamento.getStatus() != StatusPagamento.PAGO) {
            return PagamentoMapper.paraDto(pagamento);
        }

        AsaasPagamentoGatewayResponse gatewayResponse = asaasGatewayClient.consultarPagamento(pagamento.getGatewayPaymentId());
        pagamento.atualizarConsultaGateway(
                paraStatusM5A(gatewayResponse.statusGateway()),
                gatewayResponse.valorTaxaGateway(),
                gatewayResponse.valorLiquidoRecebido(),
                gatewayResponse.urlPagamento(),
                gatewayResponse.pixCopiaECola(),
                gatewayResponse.payloadResumo()
        );
        return PagamentoMapper.paraDto(pagamento);
    }

    @Transactional
    public CheckoutDto criarCheckout(Long usuarioId, CheckoutRequest request) {
        atendimentoExpiracaoService.expirarAtendimentosNaoPagosVencidos();
        AtendimentoFaxina atendimento = buscarAtendimentoDoCliente(usuarioId, request.atendimentoId());
        var pagamentoExistente = pagamentoRepository.findByAtendimentoIdForUpdate(atendimento.getId());
        validarAtendimentoAguardandoPagamento(atendimento);
        if (pagamentoExistente.isPresent()) {
            return checkoutDtoParaPagamentoExistente(pagamentoExistente.get());
        }

        AsaasCheckoutGatewayResponse gatewayResponse = asaasGatewayClient.criarCheckout(new AsaasCheckoutRequest(
                atendimento.getId(),
                atendimento.getValorServico(),
                "Leidy Cleaner Services - atendimento #" + atendimento.getId()
        ));
        validarUrlPagamentoGateway(gatewayResponse.checkoutUrl());

        Pagamento pagamento = new Pagamento(
                atendimento,
                GatewayPagamento.ASAAS,
                gatewayResponse.checkoutId(),
                gatewayResponse.metodoPagamento(),
                StatusPagamento.PENDENTE,
                atendimento.getValorServico(),
                gatewayResponse.checkoutUrl(),
                null,
                gatewayResponse.payloadResumo()
        );
        pagamentoRepository.save(pagamento);

        return new CheckoutDto(
                atendimento.getId(),
                gatewayResponse.checkoutUrl(),
                gatewayResponse.checkoutUrl(),
                atendimento.getValorServico(),
                "Leidy Cleaner Services - atendimento #" + atendimento.getId()
        );
    }

    private CheckoutDto checkoutDtoParaPagamentoExistente(Pagamento pagamento) {
        validarUrlPagamentoExistente(pagamento.getUrlPagamento());
        return new CheckoutDto(
                pagamento.getAtendimento().getId(),
                pagamento.getUrlPagamento(),
                pagamento.getUrlPagamento(),
                pagamento.getValorBruto(),
                "Leidy Cleaner Services - atendimento #" + pagamento.getAtendimento().getId()
        );
    }

    private void validarUrlPagamentoExistente(String urlPagamento) {
        if (urlPagamento == null || urlPagamento.isBlank()) {
            throw new BusinessException(
                    "PAGAMENTO_URL_INDISPONIVEL",
                    "Pagamento ja existe para este atendimento, mas nao possui URL de pagamento",
                    HttpStatus.CONFLICT
            );
        }
    }

    private void validarUrlPagamentoGateway(String urlPagamento) {
        if (urlPagamento == null || urlPagamento.isBlank()) {
            throw new BusinessException(
                    "ASAAS_PAYMENT_URL_NOT_RETURNED",
                    "URL de pagamento nao retornada pelo Asaas",
                    HttpStatus.BAD_GATEWAY
            );
        }
    }

    private AtendimentoFaxina buscarAtendimentoDoCliente(Long usuarioId, Long atendimentoId) {
        AtendimentoFaxina atendimento = atendimentoFaxinaRepository.findByIdWithResumo(atendimentoId)
                .orElseThrow(() -> new BusinessException("ATENDIMENTO_NOT_FOUND", "Atendimento nao encontrado", HttpStatus.NOT_FOUND));
        if (!atendimento.getCliente().getUsuario().getId().equals(usuarioId)) {
            throw new BusinessException("ATENDIMENTO_NOT_FOUND", "Atendimento nao encontrado", HttpStatus.NOT_FOUND);
        }
        return atendimento;
    }

    private void validarAtendimentoAguardandoPagamento(AtendimentoFaxina atendimento) {
        if (atendimento.getStatus() != StatusAtendimento.AGUARDANDO_PAGAMENTO) {
            throw new BusinessException("ATENDIMENTO_STATUS_INCOMPATIVEL", "Atendimento nao esta aguardando pagamento", HttpStatus.CONFLICT);
        }
    }

    private void validarClienteDoPagamento(Long usuarioId, Pagamento pagamento) {
        if (!pagamento.getAtendimento().getCliente().getUsuario().getId().equals(usuarioId)) {
            throw new AccessDeniedException("Usuario autenticado nao pode acessar este pagamento");
        }
    }

    private void validarClienteOuAdminDoPagamento(Long usuarioId, Pagamento pagamento) {
        if (isAdmin(usuarioId)) {
            return;
        }
        validarClienteDoPagamento(usuarioId, pagamento);
    }

    private boolean isAdmin(Long usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .map(usuario -> usuario.getTipoUsuario() == TipoUsuario.ADMIN)
                .orElse(false);
    }

    private StatusPagamento paraStatusM5A(String statusGateway) {
        if (statusGateway == null || statusGateway.isBlank()) {
            return StatusPagamento.PENDENTE;
        }
        return switch (statusGateway) {
            case "RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH" -> StatusPagamento.AGUARDANDO_CONFIRMACAO;
            case "DELETED", "REFUND_REQUESTED", "CHARGEBACK_REQUESTED", "CHARGEBACK_DISPUTE",
                    "AWAITING_CHARGEBACK_REVERSAL" -> StatusPagamento.CANCELADO;
            case "REFUNDED" -> StatusPagamento.ESTORNADO;
            default -> StatusPagamento.PENDENTE;
        };
    }
}
