package br.com.leidycleaner.usuarios.mapper;

import java.util.stream.Collectors;

import br.com.leidycleaner.usuarios.dto.AdminUsuarioResponse;
import br.com.leidycleaner.usuarios.dto.UsuarioResumoDto;
import br.com.leidycleaner.usuarios.entity.Usuario;

public final class UsuarioMapper {

    private UsuarioMapper() {
    }

    public static UsuarioResumoDto paraResumo(Usuario usuario) {
        return new UsuarioResumoDto(
                usuario.getId(),
                usuario.getNomeCompleto(),
                usuario.getEmail(),
                usuario.getTelefone(),
                usuario.getTipoUsuario(),
                usuario.getStatusConta(),
                usuario.isEmailVerificado(),
                usuario.isTelefoneVerificado(),
                usuario.getUltimoLoginEm(),
                usuario.getRoles().stream()
                        .map(role -> role.getNome().name())
                        .collect(Collectors.toUnmodifiableSet())
        );
    }

    public static AdminUsuarioResponse paraAdminResponse(
            Usuario usuario,
            Long perfilClienteId,
            Long perfilProfissionalId
    ) {
        return new AdminUsuarioResponse(
                usuario.getId(),
                perfilClienteId,
                perfilProfissionalId,
                usuario.getNomeCompleto(),
                usuario.getEmail(),
                usuario.getTelefone(),
                usuario.getTipoUsuario(),
                usuario.getStatusConta(),
                usuario.isEmailVerificado(),
                usuario.isTelefoneVerificado(),
                usuario.getUltimoLoginEm(),
                usuario.getCriadoEm(),
                usuario.getAtualizadoEm()
        );
    }
}
