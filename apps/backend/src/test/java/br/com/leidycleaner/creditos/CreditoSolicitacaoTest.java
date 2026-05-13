package br.com.leidycleaner.creditos;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import br.com.leidycleaner.clientes.entity.PerfilCliente;
import br.com.leidycleaner.creditos.entity.CreditoSolicitacao;
import br.com.leidycleaner.enderecos.entity.Endereco;
import br.com.leidycleaner.pagamentos.entity.Pagamento;
import br.com.leidycleaner.regioes.entity.RegiaoAtendimento;
import br.com.leidycleaner.solicitacoes.entity.SolicitacaoFaxina;
import br.com.leidycleaner.solicitacoes.entity.TipoServico;

class CreditoSolicitacaoTest {

    @Test
    void equivalenciaRejeitaSolicitacaoComDuracaoMenor() {
        CreditoSolicitacao credito = criarCreditoOrigem(TipoServico.FAXINA_RESIDENCIAL, 8, 10L);

        assertThat(credito.equivaleASolicitacao(criarSolicitacaoDestino(TipoServico.FAXINA_RESIDENCIAL, 4, 10L)))
                .isFalse();
    }

    @Test
    void equivalenciaRejeitaSolicitacaoComDuracaoMaior() {
        CreditoSolicitacao credito = criarCreditoOrigem(TipoServico.FAXINA_RESIDENCIAL, 8, 10L);

        assertThat(credito.equivaleASolicitacao(criarSolicitacaoDestino(TipoServico.FAXINA_RESIDENCIAL, 10, 10L)))
                .isFalse();
    }

    @Test
    void equivalenciaRejeitaTipoServicoDiferente() {
        CreditoSolicitacao credito = criarCreditoOrigem(TipoServico.FAXINA_RESIDENCIAL, 8, 10L);

        assertThat(credito.equivaleASolicitacao(criarSolicitacaoDestino(TipoServico.FAXINA_EVENTO, 8, 10L)))
                .isFalse();
    }

    @Test
    void equivalenciaRejeitaRegiaoDiferente() {
        CreditoSolicitacao credito = criarCreditoOrigem(TipoServico.FAXINA_RESIDENCIAL, 8, 10L);

        assertThat(credito.equivaleASolicitacao(criarSolicitacaoDestino(TipoServico.FAXINA_RESIDENCIAL, 8, 99L)))
                .isFalse();
    }

    @Test
    void equivalenciaAceitaSolicitacaoEquivalente() {
        CreditoSolicitacao credito = criarCreditoOrigem(TipoServico.FAXINA_RESIDENCIAL, 8, 10L);

        assertThat(credito.equivaleASolicitacao(criarSolicitacaoDestino(TipoServico.FAXINA_RESIDENCIAL, 8, 10L)))
                .isTrue();
    }

    private CreditoSolicitacao criarCreditoOrigem(TipoServico tipoServico, int duracaoHoras, Long regiaoId) {
        SolicitacaoFaxina solicitacaoOrigem = mock(SolicitacaoFaxina.class);
        PerfilCliente cliente = mock(PerfilCliente.class);
        RegiaoAtendimento regiao = mock(RegiaoAtendimento.class);
        Endereco endereco = mock(Endereco.class);
        Pagamento pagamento = mock(Pagamento.class);

        given(solicitacaoOrigem.getCliente()).willReturn(cliente);
        given(solicitacaoOrigem.getTipoServico()).willReturn(tipoServico);
        given(solicitacaoOrigem.getDuracaoEstimadaHoras()).willReturn(duracaoHoras);
        given(solicitacaoOrigem.getRegiao()).willReturn(regiao);
        given(solicitacaoOrigem.getEndereco()).willReturn(endereco);
        given(solicitacaoOrigem.getValorServico()).willReturn(new BigDecimal("320.00"));
        given(regiao.getId()).willReturn(regiaoId);

        return CreditoSolicitacao.criarDisponivel(solicitacaoOrigem, pagamento, "Credito de teste");
    }

    private SolicitacaoFaxina criarSolicitacaoDestino(TipoServico tipoServico, int duracaoHoras, Long regiaoId) {
        SolicitacaoFaxina solicitacaoDestino = mock(SolicitacaoFaxina.class);
        RegiaoAtendimento regiao = mock(RegiaoAtendimento.class);

        given(solicitacaoDestino.getTipoServico()).willReturn(tipoServico);
        given(solicitacaoDestino.getDuracaoEstimadaHoras()).willReturn(duracaoHoras);
        given(solicitacaoDestino.getRegiao()).willReturn(regiao);
        given(regiao.getId()).willReturn(regiaoId);
        return solicitacaoDestino;
    }
}
