package br.com.leidycleaner.convites;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import br.com.leidycleaner.atendimentos.repository.AtendimentoFaxinaRepository;
import br.com.leidycleaner.convites.entity.ConviteProfissional;
import br.com.leidycleaner.convites.repository.ConviteProfissionalRepository;
import br.com.leidycleaner.convites.service.ConviteProfissionalService;
import br.com.leidycleaner.core.exception.BusinessException;
import br.com.leidycleaner.creditos.service.CreditoSolicitacaoService;
import br.com.leidycleaner.pagamentos.repository.PagamentoRepository;
import br.com.leidycleaner.profissionais.repository.PerfilProfissionalRepository;
import br.com.leidycleaner.solicitacoes.entity.SolicitacaoFaxina;
import br.com.leidycleaner.solicitacoes.entity.SolicitacaoProfissionalSelecionado;
import br.com.leidycleaner.solicitacoes.entity.StatusSolicitacao;
import br.com.leidycleaner.solicitacoes.repository.SolicitacaoFaxinaRepository;
import br.com.leidycleaner.solicitacoes.repository.SolicitacaoProfissionalSelecionadoRepository;

@ExtendWith(MockitoExtension.class)
class ConviteProfissionalServiceTest {

    @Mock
    private ConviteProfissionalRepository conviteProfissionalRepository;

    @Mock
    private PerfilProfissionalRepository perfilProfissionalRepository;

    @Mock
    private SolicitacaoFaxinaRepository solicitacaoFaxinaRepository;

    @Mock
    private SolicitacaoProfissionalSelecionadoRepository solicitacaoProfissionalSelecionadoRepository;

    @Mock
    private AtendimentoFaxinaRepository atendimentoFaxinaRepository;

    @Mock
    private PagamentoRepository pagamentoRepository;

    @Mock
    private CreditoSolicitacaoService creditoSolicitacaoService;

    @Test
    void criarConviteParaSolicitacaoPagaRejeitaMaisDeUmaProfissionalSelecionada() {
        ConviteProfissionalService service = new ConviteProfissionalService(
                conviteProfissionalRepository,
                perfilProfissionalRepository,
                solicitacaoFaxinaRepository,
                solicitacaoProfissionalSelecionadoRepository,
                atendimentoFaxinaRepository,
                pagamentoRepository,
                creditoSolicitacaoService
        );
        SolicitacaoFaxina solicitacao = mock(SolicitacaoFaxina.class);
        given(solicitacao.getId()).willReturn(10L);
        given(solicitacao.getStatus()).willReturn(StatusSolicitacao.AGUARDANDO_PAGAMENTO);
        given(solicitacaoProfissionalSelecionadoRepository.findBySolicitacaoIdOrderByOrdemEscolhaAsc(10L))
                .willReturn(List.of(
                        mock(SolicitacaoProfissionalSelecionado.class),
                        mock(SolicitacaoProfissionalSelecionado.class)
                ));

        assertThatThrownBy(() -> service.criarConviteParaSolicitacaoPaga(solicitacao))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getCode()).isEqualTo("SOLICITACAO_PROFISSIONAL_SELECIONADA_INVALIDA")
                );

        then(conviteProfissionalRepository).should(never()).save(any(ConviteProfissional.class));
    }
}
