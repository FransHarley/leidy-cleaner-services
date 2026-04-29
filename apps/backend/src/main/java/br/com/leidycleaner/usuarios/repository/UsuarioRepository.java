package br.com.leidycleaner.usuarios.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.leidycleaner.usuarios.entity.StatusConta;
import br.com.leidycleaner.usuarios.entity.TipoUsuario;
import br.com.leidycleaner.usuarios.entity.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    boolean existsByEmail(String email);

    @EntityGraph(attributePaths = "roles")
    Optional<Usuario> findByEmail(String email);

    @Query("""
            select usuario
            from Usuario usuario
            where (:tipoUsuario is null or usuario.tipoUsuario = :tipoUsuario)
              and (:statusConta is null or usuario.statusConta = :statusConta)
              and (
                  :searchTerm is null
                  or lower(usuario.nomeCompleto) like :searchTerm
                  or lower(usuario.email) like :searchTerm
                  or lower(usuario.telefone) like :searchTerm
              )
            order by usuario.criadoEm desc, usuario.id desc
            """)
    List<Usuario> findAdminList(
            @Param("tipoUsuario") TipoUsuario tipoUsuario,
            @Param("statusConta") StatusConta statusConta,
            @Param("searchTerm") String searchTerm
    );
}
