package br.com.leidycleaner.usuarios.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.leidycleaner.usuarios.entity.UsuarioAceite;

public interface UsuarioAceiteRepository extends JpaRepository<UsuarioAceite, Long> {

    List<UsuarioAceite> findByUsuarioIdOrderByAceitoEmAsc(Long usuarioId);
}
