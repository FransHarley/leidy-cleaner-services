package br.com.leidycleaner.creditos.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.leidycleaner.creditos.entity.CreditoClienteMovimento;

public interface CreditoClienteMovimentoRepository extends JpaRepository<CreditoClienteMovimento, Long> {
}
