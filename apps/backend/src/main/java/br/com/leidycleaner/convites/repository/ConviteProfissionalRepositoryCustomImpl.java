package br.com.leidycleaner.convites.repository;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.stereotype.Repository;

import br.com.leidycleaner.convites.dto.AdminConviteMonitoramentoDto;
import br.com.leidycleaner.convites.entity.StatusConvite;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;

@Repository
class ConviteProfissionalRepositoryCustomImpl implements ConviteProfissionalRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<AdminConviteMonitoramentoDto> findAdminMonitoramento(
            StatusConvite status,
            Long solicitacaoId,
            Long profissionalId,
            Long clienteId,
            OffsetDateTime expiraAntesDe,
            OffsetDateTime expiraDepoisDe,
            boolean somenteVencidos,
            OffsetDateTime agora
    ) {
        StringBuilder jpql = new StringBuilder("""
                select distinct new br.com.leidycleaner.convites.dto.AdminConviteMonitoramentoDto(
                    convite.id,
                    convite.status,
                    solicitacao.id,
                    solicitacao.status,
                    cliente.id,
                    clienteUsuario.nomeCompleto,
                    profissional.id,
                    profissionalUsuario.nomeCompleto,
                    solicitacao.dataHoraDesejada,
                    solicitacao.tipoServico,
                    solicitacao.duracaoEstimadaHoras,
                    regiao.nome,
                    convite.enviadoEm,
                    convite.respondidoEm,
                    convite.expiraEm,
                    case when convite.expiraEm <= :agora then true else false end,
                    pagamento.id,
                    pagamento.status,
                    credito.id
                )
                from ConviteProfissional convite
                join convite.solicitacao solicitacao
                join solicitacao.cliente cliente
                join cliente.usuario clienteUsuario
                join convite.profissional profissional
                join profissional.usuario profissionalUsuario
                join solicitacao.regiao regiao
                left join Pagamento pagamento
                    on pagamento.solicitacao.id = solicitacao.id
                left join CreditoSolicitacao credito
                    on credito.pagamentoOrigem.id = pagamento.id
                where 1 = 1
                """);

        if (status != null) {
            jpql.append(" and convite.status = :status");
        }
        if (solicitacaoId != null) {
            jpql.append(" and solicitacao.id = :solicitacaoId");
        }
        if (profissionalId != null) {
            jpql.append(" and profissional.id = :profissionalId");
        }
        if (clienteId != null) {
            jpql.append(" and cliente.id = :clienteId");
        }
        if (expiraAntesDe != null) {
            jpql.append(" and convite.expiraEm <= :expiraAntesDe");
        }
        if (expiraDepoisDe != null) {
            jpql.append(" and convite.expiraEm >= :expiraDepoisDe");
        }
        if (somenteVencidos) {
            jpql.append(" and convite.expiraEm <= :agora");
        }

        jpql.append(" order by convite.expiraEm asc, convite.id desc");

        TypedQuery<AdminConviteMonitoramentoDto> query = entityManager.createQuery(
                jpql.toString(),
                AdminConviteMonitoramentoDto.class
        );
        query.setParameter("agora", agora);

        if (status != null) {
            query.setParameter("status", status);
        }
        if (solicitacaoId != null) {
            query.setParameter("solicitacaoId", solicitacaoId);
        }
        if (profissionalId != null) {
            query.setParameter("profissionalId", profissionalId);
        }
        if (clienteId != null) {
            query.setParameter("clienteId", clienteId);
        }
        if (expiraAntesDe != null) {
            query.setParameter("expiraAntesDe", expiraAntesDe);
        }
        if (expiraDepoisDe != null) {
            query.setParameter("expiraDepoisDe", expiraDepoisDe);
        }

        return query.getResultList();
    }
}
