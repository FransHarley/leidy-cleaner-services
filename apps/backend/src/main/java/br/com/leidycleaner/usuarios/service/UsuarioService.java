package br.com.leidycleaner.usuarios.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.leidycleaner.clientes.repository.PerfilClienteRepository;
import br.com.leidycleaner.core.exception.BusinessException;
import br.com.leidycleaner.profissionais.repository.PerfilProfissionalRepository;
import br.com.leidycleaner.usuarios.dto.AdminUsuarioResponse;
import br.com.leidycleaner.usuarios.dto.AlterarStatusUsuarioRequest;
import br.com.leidycleaner.usuarios.dto.UsuarioResumoDto;
import br.com.leidycleaner.usuarios.entity.StatusConta;
import br.com.leidycleaner.usuarios.entity.TipoUsuario;
import br.com.leidycleaner.usuarios.entity.Usuario;
import br.com.leidycleaner.usuarios.mapper.UsuarioMapper;
import br.com.leidycleaner.usuarios.repository.UsuarioRepository;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PerfilClienteRepository perfilClienteRepository;
    private final PerfilProfissionalRepository perfilProfissionalRepository;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            PerfilClienteRepository perfilClienteRepository,
            PerfilProfissionalRepository perfilProfissionalRepository
    ) {
        this.usuarioRepository = usuarioRepository;
        this.perfilClienteRepository = perfilClienteRepository;
        this.perfilProfissionalRepository = perfilProfissionalRepository;
    }

    @Transactional(readOnly = true)
    public boolean emailJaCadastrado(String email) {
        return usuarioRepository.existsByEmail(email);
    }

    @Transactional(readOnly = true)
    public Optional<UsuarioResumoDto> buscarResumoPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .map(UsuarioMapper::paraResumo);
    }

    @Transactional(readOnly = true)
    public List<AdminUsuarioResponse> listarAdmin(
            TipoUsuario tipoUsuario,
            StatusConta statusConta,
            String search
    ) {
        String searchTerm = normalizarBusca(search);

        return usuarioRepository.findAdminList(tipoUsuario, statusConta, searchTerm)
                .stream()
                .map(this::paraAdminResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminUsuarioResponse buscarAdmin(Long usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .map(this::paraAdminResponse)
                .orElseThrow(() -> new BusinessException("USUARIO_NOT_FOUND", "Usuario nao encontrado"));
    }

    @Transactional
    public UsuarioResumoDto alterarStatus(Long usuarioId, AlterarStatusUsuarioRequest request) {
        return usuarioRepository.findById(usuarioId)
                .map(usuario -> {
                    usuario.alterarStatusConta(request.statusConta());
                    return UsuarioMapper.paraResumo(usuario);
                })
                .orElseThrow(() -> new BusinessException("USUARIO_NOT_FOUND", "Usuario nao encontrado"));
    }

    private AdminUsuarioResponse paraAdminResponse(Usuario usuario) {
        Long perfilClienteId = perfilClienteRepository.findByUsuarioId(usuario.getId())
                .map(perfil -> perfil.getId())
                .orElse(null);
        Long perfilProfissionalId = perfilProfissionalRepository.findByUsuarioId(usuario.getId())
                .map(perfil -> perfil.getId())
                .orElse(null);

        return UsuarioMapper.paraAdminResponse(usuario, perfilClienteId, perfilProfissionalId);
    }

    private String normalizarBusca(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }

        return "%" + search.trim().toLowerCase() + "%";
    }
}
