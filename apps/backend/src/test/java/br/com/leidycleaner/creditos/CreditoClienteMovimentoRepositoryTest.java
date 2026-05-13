package br.com.leidycleaner.creditos;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import br.com.leidycleaner.clientes.entity.PerfilCliente;
import br.com.leidycleaner.clientes.repository.PerfilClienteRepository;
import br.com.leidycleaner.creditos.entity.CreditoClienteMovimento;
import br.com.leidycleaner.creditos.entity.TipoMovimentoCreditoCliente;
import br.com.leidycleaner.creditos.repository.CreditoClienteMovimentoRepository;
import br.com.leidycleaner.enderecos.entity.Endereco;
import br.com.leidycleaner.enderecos.repository.EnderecoRepository;
import br.com.leidycleaner.pagamentos.entity.GatewayPagamento;
import br.com.leidycleaner.pagamentos.entity.MetodoPagamento;
import br.com.leidycleaner.pagamentos.entity.Pagamento;
import br.com.leidycleaner.pagamentos.entity.StatusPagamento;
import br.com.leidycleaner.pagamentos.repository.PagamentoRepository;
import br.com.leidycleaner.regioes.entity.RegiaoAtendimento;
import br.com.leidycleaner.regioes.repository.RegiaoAtendimentoRepository;
import br.com.leidycleaner.solicitacoes.entity.SolicitacaoFaxina;
import br.com.leidycleaner.solicitacoes.entity.TipoServico;
import br.com.leidycleaner.solicitacoes.repository.SolicitacaoFaxinaRepository;
import br.com.leidycleaner.usuarios.entity.StatusConta;
import br.com.leidycleaner.usuarios.entity.TipoUsuario;
import br.com.leidycleaner.usuarios.entity.Usuario;
import br.com.leidycleaner.usuarios.repository.UsuarioRepository;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CreditoClienteMovimentoRepositoryTest {

    private final UsuarioRepository usuarioRepository;
    private final PerfilClienteRepository perfilClienteRepository;
    private final EnderecoRepository enderecoRepository;
    private final RegiaoAtendimentoRepository regiaoAtendimentoRepository;
    private final SolicitacaoFaxinaRepository solicitacaoFaxinaRepository;
    private final PagamentoRepository pagamentoRepository;
    private final CreditoClienteMovimentoRepository creditoClienteMovimentoRepository;

    @Autowired
    CreditoClienteMovimentoRepositoryTest(
            UsuarioRepository usuarioRepository,
            PerfilClienteRepository perfilClienteRepository,
            EnderecoRepository enderecoRepository,
            RegiaoAtendimentoRepository regiaoAtendimentoRepository,
            SolicitacaoFaxinaRepository solicitacaoFaxinaRepository,
            PagamentoRepository pagamentoRepository,
            CreditoClienteMovimentoRepository creditoClienteMovimentoRepository
    ) {
        this.usuarioRepository = usuarioRepository;
        this.perfilClienteRepository = perfilClienteRepository;
        this.enderecoRepository = enderecoRepository;
        this.regiaoAtendimentoRepository = regiaoAtendimentoRepository;
        this.solicitacaoFaxinaRepository = solicitacaoFaxinaRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.creditoClienteMovimentoRepository = creditoClienteMovimentoRepository;
    }

    @Test
    void persisteMovimentoLegadoDeAuditoriaSemVirarRegraDeSaldoDoCliente() {
        PerfilCliente cliente = criarCliente("credito.step1@example.com");
        RegiaoAtendimento regiao = regiaoAtendimentoRepository.findByAtivoTrueOrderByNomeAsc().get(0);
        Endereco endereco = enderecoRepository.saveAndFlush(new Endereco(
                cliente.getUsuario(),
                "90010-000",
                "Rua Estrutural",
                "123",
                null,
                regiao.getNome(),
                "Porto Alegre",
                "RS",
                null,
                null,
                true
        ));
        SolicitacaoFaxina solicitacao = solicitacaoFaxinaRepository.saveAndFlush(new SolicitacaoFaxina(
                cliente,
                endereco,
                regiao,
                OffsetDateTime.now().plusDays(2),
                4,
                TipoServico.FAXINA_RESIDENCIAL,
                null,
                new BigDecimal("180.00"),
                new BigDecimal("20.00"),
                new BigDecimal("144.00")
        ));
        Pagamento pagamento = pagamentoRepository.saveAndFlush(new Pagamento(
                solicitacao,
                GatewayPagamento.ASAAS,
                "pay_step1_credito",
                MetodoPagamento.PIX,
                StatusPagamento.AGUARDANDO_CONFIRMACAO,
                new BigDecimal("180.00"),
                "https://asaas.local/pay_step1_credito",
                null,
                "{\"id\":\"pay_step1_credito\"}"
        ));

        assertThat(pagamento.getAtendimento()).isNull();
        assertThat(pagamento.getSolicitacao()).isEqualTo(solicitacao);

        CreditoClienteMovimento movimento = creditoClienteMovimentoRepository.saveAndFlush(new CreditoClienteMovimento(
                cliente,
                solicitacao,
                pagamento,
                null,
                TipoMovimentoCreditoCliente.CREDITO_GERADO_SEM_ACEITE,
                new BigDecimal("180.00"),
                new BigDecimal("180.00"),
                "Movimento legado de auditoria"
        ));

        assertThat(movimento.getId()).isNotNull();
        assertThat(movimento.getCriadoEm()).isNotNull();
        assertThat(movimento.getValor()).isEqualByComparingTo("180.00");

        assertThatThrownBy(() -> creditoClienteMovimentoRepository.saveAndFlush(new CreditoClienteMovimento(
                cliente,
                solicitacao,
                pagamento,
                null,
                TipoMovimentoCreditoCliente.CREDITO_GERADO_SEM_ACEITE,
                new BigDecimal("180.00"),
                new BigDecimal("180.00"),
                "Movimento legado duplicado de auditoria"
        ))).isInstanceOf(DataIntegrityViolationException.class);
    }

    private PerfilCliente criarCliente(String email) {
        Usuario usuario = usuarioRepository.saveAndFlush(new Usuario(
                "Cliente Credito Step 1",
                email,
                "+5551999910000",
                "$2a$10$hash-de-teste-nao-e-senha-crua",
                TipoUsuario.CLIENTE,
                StatusConta.ATIVA
        ));
        return perfilClienteRepository.saveAndFlush(new PerfilCliente(usuario, null));
    }
}
