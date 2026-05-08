package br.com.leidycleaner.atendimentos.service;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import br.com.leidycleaner.atendimentos.entity.AtendimentoFaxina;
import br.com.leidycleaner.atendimentos.entity.StatusAtendimento;
import br.com.leidycleaner.atendimentos.repository.AtendimentoFaxinaRepository;
import br.com.leidycleaner.pagamentos.entity.Pagamento;
import br.com.leidycleaner.pagamentos.entity.StatusPagamento;
import br.com.leidycleaner.pagamentos.repository.PagamentoRepository;

@Service
public class AtendimentoExpiracaoService {

    private final AtendimentoFaxinaRepository atendimentoFaxinaRepository;
    private final PagamentoRepository pagamentoRepository;

    public AtendimentoExpiracaoService(
            AtendimentoFaxinaRepository atendimentoFaxinaRepository,
            PagamentoRepository pagamentoRepository
    ) {
        this.atendimentoFaxinaRepository = atendimentoFaxinaRepository;
        this.pagamentoRepository = pagamentoRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int expirarAtendimentosNaoPagosVencidos() {
        OffsetDateTime agora = OffsetDateTime.now();
        List<AtendimentoFaxina> vencidos = atendimentoFaxinaRepository.findVencidosSemPagamentoPagoForUpdate(
                StatusAtendimento.AGUARDANDO_PAGAMENTO,
                StatusPagamento.PAGO,
                agora
        );
        int expirados = 0;

        for (AtendimentoFaxina atendimento : vencidos) {
            if (atendimento.getStatus() != StatusAtendimento.AGUARDANDO_PAGAMENTO
                    || !atendimento.getInicioPrevistoEm().isBefore(agora)) {
                continue;
            }

            var pagamentoOptional = pagamentoRepository.findByAtendimentoIdForUpdate(atendimento.getId());
            if (pagamentoOptional.map(Pagamento::getStatus).filter(StatusPagamento.PAGO::equals).isPresent()) {
                continue;
            }

            atendimento.cancelar();
            atendimento.getSolicitacao().expirar();
            pagamentoOptional.ifPresent(Pagamento::cancelarSeAguardandoConfirmacao);
            expirados++;
        }

        return expirados;
    }
}
