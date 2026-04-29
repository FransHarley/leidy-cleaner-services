package br.com.leidycleaner.usuarios.dto;

import java.time.OffsetDateTime;

import br.com.leidycleaner.usuarios.entity.StatusConta;
import br.com.leidycleaner.usuarios.entity.TipoUsuario;

public record AdminUsuarioResponse(
        Long usuarioId,
        Long perfilClienteId,
        Long perfilProfissionalId,
        String nomeCompleto,
        String email,
        String telefone,
        TipoUsuario tipoUsuario,
        StatusConta statusConta,
        boolean emailVerificado,
        boolean telefoneVerificado,
        OffsetDateTime ultimoLoginEm,
        OffsetDateTime criadoEm,
        OffsetDateTime atualizadoEm
) {
}
