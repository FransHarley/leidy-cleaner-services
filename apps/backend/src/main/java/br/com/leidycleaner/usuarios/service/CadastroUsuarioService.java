package br.com.leidycleaner.usuarios.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.leidycleaner.auth.entity.Role;
import br.com.leidycleaner.auth.entity.RoleName;
import br.com.leidycleaner.auth.mapper.AuthMapper;
import br.com.leidycleaner.auth.service.RoleService;
import br.com.leidycleaner.clientes.entity.PerfilCliente;
import br.com.leidycleaner.clientes.repository.PerfilClienteRepository;
import br.com.leidycleaner.core.exception.BusinessException;
import br.com.leidycleaner.profissionais.dto.DefinirRegioesProfissionalRequest;
import br.com.leidycleaner.profissionais.entity.PerfilProfissional;
import br.com.leidycleaner.profissionais.entity.StatusAprovacaoProfissional;
import br.com.leidycleaner.profissionais.repository.PerfilProfissionalRepository;
import br.com.leidycleaner.profissionais.service.ProfissionalOnboardingService;
import br.com.leidycleaner.usuarios.dto.CadastroClienteRequest;
import br.com.leidycleaner.usuarios.dto.CadastroProfissionalCompletoRequest;
import br.com.leidycleaner.usuarios.dto.CadastroProfissionalRequest;
import br.com.leidycleaner.usuarios.dto.CadastroUsuarioResponse;
import br.com.leidycleaner.usuarios.entity.StatusConta;
import br.com.leidycleaner.usuarios.entity.TipoUsuario;
import br.com.leidycleaner.usuarios.entity.Usuario;
import br.com.leidycleaner.usuarios.repository.UsuarioRepository;
import br.com.leidycleaner.verificacao.service.DocumentoVerificacaoService;

@Service
public class CadastroUsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PerfilClienteRepository perfilClienteRepository;
    private final PerfilProfissionalRepository perfilProfissionalRepository;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioAceiteService usuarioAceiteService;
    private final DocumentoVerificacaoService documentoVerificacaoService;
    private final ProfissionalOnboardingService profissionalOnboardingService;

    public CadastroUsuarioService(
            UsuarioRepository usuarioRepository,
            PerfilClienteRepository perfilClienteRepository,
            PerfilProfissionalRepository perfilProfissionalRepository,
            RoleService roleService,
            PasswordEncoder passwordEncoder,
            UsuarioAceiteService usuarioAceiteService,
            DocumentoVerificacaoService documentoVerificacaoService,
            ProfissionalOnboardingService profissionalOnboardingService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.perfilClienteRepository = perfilClienteRepository;
        this.perfilProfissionalRepository = perfilProfissionalRepository;
        this.roleService = roleService;
        this.passwordEncoder = passwordEncoder;
        this.usuarioAceiteService = usuarioAceiteService;
        this.documentoVerificacaoService = documentoVerificacaoService;
        this.profissionalOnboardingService = profissionalOnboardingService;
    }

    @Transactional
    public CadastroUsuarioResponse cadastrarCliente(CadastroClienteRequest request, String ipOrigem, String userAgent) {
        String email = normalizarEmail(request.email());
        String cpf = CpfValidator.normalizarEValidar(request.cpf());
        validarEmailDisponivel(email);
        validarCpfDisponivel(cpf);

        Usuario usuario = criarUsuarioBase(
                request.nomeCompleto(),
                email,
                request.telefone(),
                cpf,
                request.senha(),
                TipoUsuario.CLIENTE,
                StatusConta.ATIVA,
                RoleName.ROLE_CLIENTE
        );

        Usuario usuarioSalvo = usuarioRepository.save(usuario);
        PerfilCliente perfil = perfilClienteRepository.save(new PerfilCliente(usuarioSalvo, request.observacoesInternas()));
        usuarioAceiteService.registrarAceitesObrigatorios(usuarioSalvo, ipOrigem, userAgent);

        return new CadastroUsuarioResponse(AuthMapper.paraUsuarioAutenticado(usuarioSalvo), perfil.getId());
    }

    @Transactional
    public CadastroUsuarioResponse cadastrarProfissional(CadastroProfissionalRequest request, String ipOrigem, String userAgent) {
        return cadastrarProfissionalBase(
                request.nomeCompleto(),
                request.email(),
                request.telefone(),
                request.senha(),
                request.nomeExibicao(),
                request.cpf(),
                request.dataNascimento(),
                request.descricao(),
                request.fotoPerfilUrl(),
                request.experienciaAnos(),
                ipOrigem,
                userAgent
        ).response();
    }

    @Transactional
    public CadastroUsuarioResponse cadastrarProfissionalCompleto(
            CadastroProfissionalCompletoRequest request,
            String ipOrigem,
            String userAgent
    ) {
        CadastroProfissionalCriado cadastro = cadastrarProfissionalBase(
                request.nomeCompleto(),
                request.email(),
                request.telefone(),
                request.senha(),
                request.nomeExibicao(),
                request.cpf(),
                request.dataNascimento(),
                request.descricao(),
                request.fotoPerfilUrl(),
                request.experienciaAnos(),
                ipOrigem,
                userAgent
        );

        documentoVerificacaoService.registrar(cadastro.usuario().getId(), request.documento());
        profissionalOnboardingService.definirMinhasRegioes(
                cadastro.usuario().getId(),
                new DefinirRegioesProfissionalRequest(request.regiaoIds())
        );
        request.disponibilidades()
                .forEach(disponibilidade -> profissionalOnboardingService.criarDisponibilidade(cadastro.usuario().getId(), disponibilidade));

        return cadastro.response();
    }

    private CadastroProfissionalCriado cadastrarProfissionalBase(
            String nomeCompleto,
            String emailOriginal,
            String telefone,
            String senha,
            String nomeExibicao,
            String cpfOriginal,
            java.time.LocalDate dataNascimento,
            String descricao,
            String fotoPerfilUrl,
            Integer experienciaAnos,
            String ipOrigem,
            String userAgent
    ) {
        String email = normalizarEmail(emailOriginal);
        String cpf = CpfValidator.normalizarEValidar(cpfOriginal);
        validarEmailDisponivel(email);
        validarCpfDisponivel(cpf);

        Usuario usuario = criarUsuarioBase(
                nomeCompleto,
                email,
                telefone,
                cpf,
                senha,
                TipoUsuario.PROFISSIONAL,
                StatusConta.PENDENTE_VERIFICACAO,
                RoleName.ROLE_PROFISSIONAL
        );

        Usuario usuarioSalvo = usuarioRepository.save(usuario);
        PerfilProfissional perfil = perfilProfissionalRepository.save(new PerfilProfissional(
                usuarioSalvo,
                nomeExibicao.trim(),
                cpf,
                dataNascimento,
                descricao,
                fotoPerfilUrl,
                experienciaAnos == null ? 0 : experienciaAnos,
                false,
                StatusAprovacaoProfissional.PENDENTE
        ));
        usuarioAceiteService.registrarAceitesObrigatorios(usuarioSalvo, ipOrigem, userAgent);

        return new CadastroProfissionalCriado(
                usuarioSalvo,
                perfil,
                new CadastroUsuarioResponse(AuthMapper.paraUsuarioAutenticado(usuarioSalvo), perfil.getId())
        );
    }

    private Usuario criarUsuarioBase(
            String nomeCompleto,
            String email,
            String telefone,
            String cpf,
            String senha,
            TipoUsuario tipoUsuario,
            StatusConta statusConta,
            RoleName roleName
    ) {
        Role role = roleService.buscarObrigatoria(roleName);
        Usuario usuario = new Usuario(
                nomeCompleto.trim(),
                email,
                telefone.trim(),
                cpf,
                passwordEncoder.encode(senha),
                tipoUsuario,
                statusConta
        );
        usuario.adicionarRole(role);
        return usuario;
    }

    private void validarEmailDisponivel(String email) {
        if (usuarioRepository.existsByEmail(email)) {
            throw new BusinessException("EMAIL_ALREADY_EXISTS", "Email ja cadastrado");
        }
    }

    private void validarCpfDisponivel(String cpf) {
        if (usuarioRepository.existsByCpf(cpf) || perfilProfissionalRepository.existsByCpf(cpf)) {
            throw new BusinessException("CPF_ALREADY_EXISTS", "J\u00e1 existe uma conta cadastrada com este CPF.");
        }
    }

    private String normalizarEmail(String email) {
        return email.trim().toLowerCase();
    }

    private record CadastroProfissionalCriado(
            Usuario usuario,
            PerfilProfissional perfil,
            CadastroUsuarioResponse response
    ) {
    }
}
