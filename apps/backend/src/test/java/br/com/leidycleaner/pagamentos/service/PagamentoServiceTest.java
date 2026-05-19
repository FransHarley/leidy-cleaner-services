package br.com.leidycleaner.pagamentos.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import br.com.leidycleaner.atendimentos.entity.AtendimentoFaxina;
import br.com.leidycleaner.atendimentos.entity.StatusAtendimento;
import br.com.leidycleaner.atendimentos.repository.AtendimentoFaxinaRepository;
import br.com.leidycleaner.atendimentos.service.AtendimentoExpiracaoService;
import br.com.leidycleaner.clientes.entity.PerfilCliente;
import br.com.leidycleaner.clientes.repository.PerfilClienteRepository;
import br.com.leidycleaner.pagamentos.dto.PagamentoRequest;
import br.com.leidycleaner.pagamentos.entity.MetodoPagamento;
import br.com.leidycleaner.pagamentos.entity.Pagamento;
import br.com.leidycleaner.pagamentos.gateway.AsaasCobrancaRequest;
import br.com.leidycleaner.pagamentos.gateway.AsaasCustomerGatewayResponse;
import br.com.leidycleaner.pagamentos.gateway.AsaasCustomerRequest;
import br.com.leidycleaner.pagamentos.gateway.AsaasGatewayClient;
import br.com.leidycleaner.pagamentos.gateway.AsaasPagamentoGatewayResponse;
import br.com.leidycleaner.pagamentos.repository.PagamentoRepository;
import br.com.leidycleaner.solicitacoes.entity.SolicitacaoFaxina;
import br.com.leidycleaner.solicitacoes.repository.SolicitacaoFaxinaRepository;
import br.com.leidycleaner.solicitacoes.repository.SolicitacaoProfissionalSelecionadoRepository;
import br.com.leidycleaner.usuarios.entity.StatusConta;
import br.com.leidycleaner.usuarios.entity.TipoUsuario;
import br.com.leidycleaner.usuarios.entity.Usuario;
import br.com.leidycleaner.usuarios.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class PagamentoServiceTest {

    private static final Long USUARIO_ID = 10L;
    private static final Long PERFIL_CLIENTE_ID = 20L;
    private static final Long ATENDIMENTO_ID = 30L;

    @Mock
    private PagamentoRepository pagamentoRepository;

    @Mock
    private AtendimentoFaxinaRepository atendimentoFaxinaRepository;

    @Mock
    private SolicitacaoFaxinaRepository solicitacaoFaxinaRepository;

    @Mock
    private SolicitacaoProfissionalSelecionadoRepository selecionadoRepository;

    @Mock
    private PerfilClienteRepository perfilClienteRepository;

    @Mock
    private AsaasGatewayClient asaasGatewayClient;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private AtendimentoExpiracaoService atendimentoExpiracaoService;

    @Mock
    private PagamentoConfirmacaoService pagamentoConfirmacaoService;

    private PagamentoService pagamentoService;

    @BeforeEach
    void setUp() {
        pagamentoService = new PagamentoService(
                pagamentoRepository,
                atendimentoFaxinaRepository,
                solicitacaoFaxinaRepository,
                selecionadoRepository,
                perfilClienteRepository,
                asaasGatewayClient,
                usuarioRepository,
                atendimentoExpiracaoService,
                pagamentoConfirmacaoService
        );
        when(pagamentoRepository.save(any(Pagamento.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void criarReutilizaAsaasCustomerIdExistenteSemCriarNovoCliente() {
        PerfilCliente perfilCliente = novoPerfilCliente("cliente.reuso@example.com", "12345678901");
        perfilCliente.registrarAsaasCustomerId("cus_cliente_existente");
        AtendimentoFaxina atendimento = mockAtendimento(perfilCliente);
        when(atendimentoFaxinaRepository.findByIdWithResumo(ATENDIMENTO_ID)).thenReturn(Optional.of(atendimento));
        when(pagamentoRepository.existsByAtendimentoId(ATENDIMENTO_ID)).thenReturn(false);
        when(perfilClienteRepository.findByIdForUpdate(PERFIL_CLIENTE_ID)).thenReturn(Optional.of(perfilCliente));
        when(asaasGatewayClient.criarCobranca(any())).thenReturn(gatewayResponse("pay_existente"));

        pagamentoService.criar(USUARIO_ID, new PagamentoRequest(ATENDIMENTO_ID, null, MetodoPagamento.PIX));

        verify(asaasGatewayClient, never()).criarCliente(any());
        verify(perfilClienteRepository, never()).save(any(PerfilCliente.class));
        ArgumentCaptor<AsaasCobrancaRequest> cobrancaCaptor = ArgumentCaptor.forClass(AsaasCobrancaRequest.class);
        verify(asaasGatewayClient).criarCobranca(cobrancaCaptor.capture());
        assertThat(cobrancaCaptor.getValue().customerId()).isEqualTo("cus_cliente_existente");
    }

    @Test
    void criarCriaAsaasCustomerQuandoClienteNaoPossuiIdEPersisteRetorno() {
        PerfilCliente perfilCliente = novoPerfilCliente("cliente.novo@example.com", "98765432100");
        AtendimentoFaxina atendimento = mockAtendimento(perfilCliente);
        when(atendimentoFaxinaRepository.findByIdWithResumo(ATENDIMENTO_ID)).thenReturn(Optional.of(atendimento));
        when(pagamentoRepository.existsByAtendimentoId(ATENDIMENTO_ID)).thenReturn(false);
        when(perfilClienteRepository.findByIdForUpdate(PERFIL_CLIENTE_ID)).thenReturn(Optional.of(perfilCliente));
        when(asaasGatewayClient.criarCliente(any())).thenReturn(new AsaasCustomerGatewayResponse("cus_cliente_novo"));
        when(asaasGatewayClient.criarCobranca(any())).thenReturn(gatewayResponse("pay_novo"));

        pagamentoService.criar(USUARIO_ID, new PagamentoRequest(ATENDIMENTO_ID, null, MetodoPagamento.PIX));

        ArgumentCaptor<AsaasCustomerRequest> customerCaptor = ArgumentCaptor.forClass(AsaasCustomerRequest.class);
        ArgumentCaptor<AsaasCobrancaRequest> cobrancaCaptor = ArgumentCaptor.forClass(AsaasCobrancaRequest.class);
        verify(asaasGatewayClient).criarCliente(customerCaptor.capture());
        verify(asaasGatewayClient).criarCobranca(cobrancaCaptor.capture());
        verify(perfilClienteRepository).save(perfilCliente);
        assertThat(customerCaptor.getValue().name()).isEqualTo("Cliente Solicitacao");
        assertThat(customerCaptor.getValue().email()).isEqualTo("cliente.novo@example.com");
        assertThat(customerCaptor.getValue().mobilePhone()).isEqualTo("51999998888");
        assertThat(customerCaptor.getValue().phone()).isNull();
        assertThat(customerCaptor.getValue().cpfCnpj()).isEqualTo("98765432100");
        assertThat(perfilCliente.getAsaasCustomerId()).isEqualTo("cus_cliente_novo");
        assertThat(cobrancaCaptor.getValue().customerId()).isEqualTo("cus_cliente_novo");
    }

    private PerfilCliente novoPerfilCliente(String email, String cpf) {
        Usuario usuario = new Usuario(
                "Cliente Solicitacao",
                email,
                "+5551999998888",
                cpf,
                "senha-hash",
                TipoUsuario.CLIENTE,
                StatusConta.ATIVA
        );
        ReflectionTestUtils.setField(usuario, "id", USUARIO_ID);
        PerfilCliente perfilCliente = new PerfilCliente(usuario, null);
        ReflectionTestUtils.setField(perfilCliente, "id", PERFIL_CLIENTE_ID);
        return perfilCliente;
    }

    private AtendimentoFaxina mockAtendimento(PerfilCliente perfilCliente) {
        AtendimentoFaxina atendimento = org.mockito.Mockito.mock(AtendimentoFaxina.class);
        SolicitacaoFaxina solicitacao = org.mockito.Mockito.mock(SolicitacaoFaxina.class);
        when(atendimento.getId()).thenReturn(ATENDIMENTO_ID);
        when(atendimento.getCliente()).thenReturn(perfilCliente);
        when(atendimento.getStatus()).thenReturn(StatusAtendimento.AGUARDANDO_PAGAMENTO);
        when(atendimento.getValorServico()).thenReturn(new BigDecimal("180.00"));
        when(atendimento.getSolicitacao()).thenReturn(solicitacao);
        return atendimento;
    }

    private AsaasPagamentoGatewayResponse gatewayResponse(String gatewayPaymentId) {
        return new AsaasPagamentoGatewayResponse(
                gatewayPaymentId,
                "PENDING",
                null,
                null,
                "https://asaas.local/" + gatewayPaymentId,
                null,
                "{\"id\":\"%s\",\"status\":\"PENDING\"}".formatted(gatewayPaymentId)
        );
    }
}
