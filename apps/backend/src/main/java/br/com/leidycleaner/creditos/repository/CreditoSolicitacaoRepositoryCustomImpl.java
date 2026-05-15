package br.com.leidycleaner.creditos.repository;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.stereotype.Repository;

import br.com.leidycleaner.creditos.entity.CreditoSolicitacao;
import br.com.leidycleaner.creditos.entity.StatusCreditoSolicitacao;
import br.com.leidycleaner.solicitacoes.entity.TipoServico;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;

@Repository
class CreditoSolicitacaoRepositoryCustomImpl implements CreditoSolicitacaoRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<CreditoSolicitacao> findAdminList(
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
        StringBuilder jpql = new StringBuilder("""
                select distinct credito
                from CreditoSolicitacao credito
                join fetch credito.cliente cliente
                join fetch cliente.usuario usuario
                join fetch credito.regiao regiao
                join fetch credito.solicitacaoOrigem solicitacaoOrigem
                join fetch solicitacaoOrigem.cliente clienteOrigem
                join fetch clienteOrigem.usuario
                join fetch solicitacaoOrigem.regiao
                join fetch credito.pagamentoOrigem pagamentoOrigem
                left join fetch pagamentoOrigem.atendimento
                left join fetch pagamentoOrigem.solicitacao
                left join fetch credito.solicitacaoUso solicitacaoUso
                left join fetch solicitacaoUso.cliente clienteUso
                left join fetch clienteUso.usuario
                left join fetch solicitacaoUso.regiao
                where 1 = 1
                """);

        if (status != null) {
            jpql.append(" and credito.status = :status");
        }
        if (clienteId != null) {
            jpql.append(" and cliente.id = :clienteId");
        }
        if (solicitacaoOrigemId != null) {
            jpql.append(" and solicitacaoOrigem.id = :solicitacaoOrigemId");
        }
        if (solicitacaoUsoId != null) {
            jpql.append(" and solicitacaoUso.id = :solicitacaoUsoId");
        }
        if (pagamentoOrigemId != null) {
            jpql.append(" and pagamentoOrigem.id = :pagamentoOrigemId");
        }
        if (tipoServico != null) {
            jpql.append(" and credito.tipoServico = :tipoServico");
        }
        if (regiaoId != null) {
            jpql.append(" and regiao.id = :regiaoId");
        }
        if (criadoDe != null) {
            jpql.append(" and credito.criadoEm >= :criadoDe");
        }
        if (criadoAte != null) {
            jpql.append(" and credito.criadoEm <= :criadoAte");
        }

        jpql.append(" order by credito.criadoEm desc, credito.id desc");

        TypedQuery<CreditoSolicitacao> query = entityManager.createQuery(
                jpql.toString(),
                CreditoSolicitacao.class
        );

        if (status != null) {
            query.setParameter("status", status);
        }
        if (clienteId != null) {
            query.setParameter("clienteId", clienteId);
        }
        if (solicitacaoOrigemId != null) {
            query.setParameter("solicitacaoOrigemId", solicitacaoOrigemId);
        }
        if (solicitacaoUsoId != null) {
            query.setParameter("solicitacaoUsoId", solicitacaoUsoId);
        }
        if (pagamentoOrigemId != null) {
            query.setParameter("pagamentoOrigemId", pagamentoOrigemId);
        }
        if (tipoServico != null) {
            query.setParameter("tipoServico", tipoServico);
        }
        if (regiaoId != null) {
            query.setParameter("regiaoId", regiaoId);
        }
        if (criadoDe != null) {
            query.setParameter("criadoDe", criadoDe);
        }
        if (criadoAte != null) {
            query.setParameter("criadoAte", criadoAte);
        }

        return query.getResultList();
    }
}
