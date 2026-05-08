package br.com.leidycleaner.auth.service;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.leidycleaner.auth.dto.AuthLoginRequest;
import br.com.leidycleaner.auth.dto.AuthLoginResponse;
import br.com.leidycleaner.auth.mapper.AuthMapper;
import br.com.leidycleaner.auth.security.JwtTokenProvider;
import br.com.leidycleaner.auth.security.UsuarioDetailsService;
import br.com.leidycleaner.auth.security.UsuarioPrincipal;
import br.com.leidycleaner.core.exception.BusinessException;
import br.com.leidycleaner.profissionais.entity.StatusAprovacaoProfissional;
import br.com.leidycleaner.profissionais.repository.PerfilProfissionalRepository;
import br.com.leidycleaner.usuarios.entity.Usuario;
import br.com.leidycleaner.usuarios.entity.StatusConta;
import br.com.leidycleaner.usuarios.entity.TipoUsuario;
import br.com.leidycleaner.verificacao.entity.StatusVerificacao;
import br.com.leidycleaner.verificacao.repository.DocumentoVerificacaoRepository;

@Service
public class AuthService {

    private final UsuarioDetailsService usuarioDetailsService;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final PerfilProfissionalRepository perfilProfissionalRepository;
    private final DocumentoVerificacaoRepository documentoVerificacaoRepository;

    public AuthService(
            UsuarioDetailsService usuarioDetailsService,
            JwtTokenProvider jwtTokenProvider,
            PasswordEncoder passwordEncoder,
            PerfilProfissionalRepository perfilProfissionalRepository,
            DocumentoVerificacaoRepository documentoVerificacaoRepository
    ) {
        this.usuarioDetailsService = usuarioDetailsService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
        this.perfilProfissionalRepository = perfilProfissionalRepository;
        this.documentoVerificacaoRepository = documentoVerificacaoRepository;
    }

    @Transactional
    public AuthLoginResponse login(AuthLoginRequest request) {
        UsuarioPrincipal principal = (UsuarioPrincipal) usuarioDetailsService.loadUserByUsername(
                request.email().trim().toLowerCase()
        );

        if (!passwordEncoder.matches(request.senha(), principal.getPassword())) {
            throw new BadCredentialsException("Credenciais invalidas");
        }
        if (!principal.isEnabled()) {
            throw new DisabledException("Conta inativa");
        }
        if (!principal.isAccountNonLocked()) {
            throw new LockedException("Conta bloqueada");
        }

        Usuario usuario = principal.getUsuario();
        validarAcessoProfissional(usuario);
        usuario.registrarLogin(OffsetDateTime.now(ZoneOffset.UTC));
        Instant expiresAt = jwtTokenProvider.calcularExpiracao();

        return new AuthLoginResponse(
                jwtTokenProvider.gerarToken(principal),
                "Bearer",
                expiresAt,
                AuthMapper.paraUsuarioAutenticado(usuario)
        );
    }

    private void validarAcessoProfissional(Usuario usuario) {
        if (usuario.getTipoUsuario() != TipoUsuario.PROFISSIONAL) {
            return;
        }

        var perfil = perfilProfissionalRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new BusinessException(
                        "PROFESSIONAL_PROFILE_NOT_FOUND",
                        "Perfil profissional nao encontrado.",
                        HttpStatus.FORBIDDEN
                ));

        if (perfil.getStatusAprovacao() == StatusAprovacaoProfissional.REJEITADO) {
            throw new BusinessException(
                    "PROFESSIONAL_REGISTRATION_REJECTED",
                    "Seu cadastro profissional foi rejeitado. Entre em contato com o suporte.",
                    HttpStatus.FORBIDDEN
            );
        }

        if (perfil.getStatusAprovacao() != StatusAprovacaoProfissional.APROVADO
                || usuario.getStatusConta() != StatusConta.ATIVA) {
            throw new BusinessException(
                    "PROFESSIONAL_REGISTRATION_PENDING",
                    "Seu cadastro profissional ainda est\u00e1 em an\u00e1lise e n\u00e3o foi liberado para acesso.",
                    HttpStatus.FORBIDDEN
            );
        }

        var verificacaoEfetiva = documentoVerificacaoRepository.findVerificacaoEfetivaPorUsuarioId(usuario.getId());
        if (verificacaoEfetiva.isPresent() && verificacaoEfetiva.get().getStatusVerificacao() == StatusVerificacao.REJEITADO) {
            throw new BusinessException(
                    "PROFESSIONAL_REGISTRATION_REJECTED",
                    "Seu cadastro profissional foi rejeitado. Entre em contato com o suporte.",
                    HttpStatus.FORBIDDEN
            );
        }

        if (verificacaoEfetiva.isEmpty() || verificacaoEfetiva.get().getStatusVerificacao() != StatusVerificacao.APROVADO) {
            throw new BusinessException(
                    "PROFESSIONAL_REGISTRATION_PENDING",
                    "Seu cadastro profissional ainda est\u00e1 em an\u00e1lise e n\u00e3o foi liberado para acesso.",
                    HttpStatus.FORBIDDEN
            );
        }
    }
}
