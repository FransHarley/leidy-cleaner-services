package br.com.leidycleaner.atendimentos.service;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.leidycleaner.avaliacoes.dto.AvaliacaoProfissionalDto;
import br.com.leidycleaner.avaliacoes.mapper.AvaliacaoProfissionalMapper;
import br.com.leidycleaner.avaliacoes.repository.AvaliacaoProfissionalRepository;
import br.com.leidycleaner.atendimentos.dto.AtendimentoFaxinaDto;
import br.com.leidycleaner.atendimentos.dto.CheckpointServicoDto;
import br.com.leidycleaner.atendimentos.dto.CheckpointServicoRequest;
import br.com.leidycleaner.atendimentos.entity.AtendimentoFaxina;
import br.com.leidycleaner.atendimentos.entity.CheckpointServico;
import br.com.leidycleaner.atendimentos.entity.StatusAtendimento;
import br.com.leidycleaner.atendimentos.entity.TipoCheckpointServico;
import br.com.leidycleaner.atendimentos.mapper.AtendimentoFaxinaMapper;
import br.com.leidycleaner.atendimentos.repository.AtendimentoFaxinaRepository;
import br.com.leidycleaner.atendimentos.repository.CheckpointServicoRepository;
import br.com.leidycleaner.core.exception.BusinessException;
import br.com.leidycleaner.usuarios.entity.TipoUsuario;
import br.com.leidycleaner.usuarios.entity.Usuario;
import br.com.leidycleaner.usuarios.repository.UsuarioRepository;

@Service
public class AtendimentoFaxinaService {

    private final AtendimentoFaxinaRepository atendimentoFaxinaRepository;
    private final CheckpointServicoRepository checkpointServicoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AvaliacaoProfissionalRepository avaliacaoProfissionalRepository;
    private final AtendimentoExpiracaoService atendimentoExpiracaoService;

    public AtendimentoFaxinaService(
            AtendimentoFaxinaRepository atendimentoFaxinaRepository,
            CheckpointServicoRepository checkpointServicoRepository,
            UsuarioRepository usuarioRepository,
            AvaliacaoProfissionalRepository avaliacaoProfissionalRepository,
            AtendimentoExpiracaoService atendimentoExpiracaoService
    ) {
        this.atendimentoFaxinaRepository = atendimentoFaxinaRepository;
        this.checkpointServicoRepository = checkpointServicoRepository;
        this.usuarioRepository = usuarioRepository;
        this.avaliacaoProfissionalRepository = avaliacaoProfissionalRepository;
        this.atendimentoExpiracaoService = atendimentoExpiracaoService;
    }

    @Transactional(readOnly = true)
    public List<?> listarMeus(Long usuarioId) {
        atendimentoExpiracaoService.expirarAtendimentosNaoPagosVencidos();
        Usuario usuario = buscarUsuario(usuarioId);
        return atendimentoFaxinaRepository.findRelacionadosByUsuarioId(usuarioId)
                .stream()
                .map(atendimento -> paraDtoPorPerfil(atendimento, usuario))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AtendimentoFaxinaDto> listarAdmin(
            StatusAtendimento status,
            Long clienteId,
            Long profissionalId
    ) {
        atendimentoExpiracaoService.expirarAtendimentosNaoPagosVencidos();
        return atendimentoFaxinaRepository.findAdminList(status, clienteId, profissionalId)
                .stream()
                .map(AtendimentoFaxinaMapper::paraDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public Object buscarRelacionado(Long usuarioId, Long atendimentoId) {
        atendimentoExpiracaoService.expirarAtendimentosNaoPagosVencidos();
        Usuario usuario = buscarUsuario(usuarioId);
        return paraDtoPorPerfil(buscarAtendimentoVisivel(usuario, atendimentoId), usuario);
    }

    @Transactional(readOnly = true)
    public List<CheckpointServicoDto> listarCheckpoints(Long usuarioId, Long atendimentoId) {
        atendimentoExpiracaoService.expirarAtendimentosNaoPagosVencidos();
        AtendimentoFaxina atendimento = buscarAtendimentoVisivel(buscarUsuario(usuarioId), atendimentoId);
        return checkpointServicoRepository.findByAtendimentoIdOrderByRegistradoEmAscIdAsc(atendimento.getId())
                .stream()
                .map(AtendimentoFaxinaMapper::paraDto)
                .toList();
    }

    @Transactional
    public Object iniciar(Long usuarioId, Long atendimentoId, CheckpointServicoRequest request) {
        AtendimentoFaxina atendimento = buscarAtendimentoParaExecucao(usuarioId, atendimentoId);
        validarPodeIniciar(atendimento);

        OffsetDateTime agora = OffsetDateTime.now();
        atendimento.iniciarServico(agora);
        registrarCheckpoint(atendimento, usuarioId, TipoCheckpointServico.INICIO, request, agora);

        return AtendimentoFaxinaMapper.paraProfissionalDto(atendimento);
    }

    @Transactional
    public Object finalizar(Long usuarioId, Long atendimentoId, CheckpointServicoRequest request) {
        AtendimentoFaxina atendimento = buscarAtendimentoParaExecucao(usuarioId, atendimentoId);
        validarPodeFinalizar(atendimento);

        OffsetDateTime agora = OffsetDateTime.now();
        atendimento.finalizarServico(agora);
        registrarCheckpoint(atendimento, usuarioId, TipoCheckpointServico.FIM, request, agora);

        return AtendimentoFaxinaMapper.paraProfissionalDto(atendimento);
    }

    private AtendimentoFaxina buscarAtendimentoRelacionado(Long usuarioId, Long atendimentoId) {
        return atendimentoFaxinaRepository.findRelacionadoByIdAndUsuarioId(atendimentoId, usuarioId)
                .orElseThrow(() -> new BusinessException(
                        "ATENDIMENTO_NOT_FOUND",
                        "Atendimento nao encontrado",
                        HttpStatus.NOT_FOUND
                ));
    }

    private AtendimentoFaxina buscarAtendimentoVisivel(Usuario usuario, Long atendimentoId) {
        if (isAdmin(usuario)) {
            return atendimentoFaxinaRepository.findByIdWithResumo(atendimentoId)
                    .orElseThrow(() -> new BusinessException(
                            "ATENDIMENTO_NOT_FOUND",
                            "Atendimento nao encontrado",
                            HttpStatus.NOT_FOUND
                    ));
        }

        return buscarAtendimentoRelacionado(usuario.getId(), atendimentoId);
    }

    private AtendimentoFaxina buscarAtendimentoParaExecucao(Long usuarioId, Long atendimentoId) {
        AtendimentoFaxina atendimento = atendimentoFaxinaRepository.findByIdWithResumo(atendimentoId)
                .orElseThrow(() -> new BusinessException(
                        "ATENDIMENTO_NOT_FOUND",
                        "Atendimento nao encontrado",
                        HttpStatus.NOT_FOUND
                ));
        if (atendimento.getProfissional().getUsuario().getId().equals(usuarioId)) {
            return atendimento;
        }
        if (atendimento.getCliente().getUsuario().getId().equals(usuarioId)) {
            throw new AccessDeniedException("Somente a profissional designada pode executar o atendimento");
        }
        throw new BusinessException("ATENDIMENTO_NOT_FOUND", "Atendimento nao encontrado", HttpStatus.NOT_FOUND);
    }

    private void validarPodeIniciar(AtendimentoFaxina atendimento) {
        if (checkpointServicoRepository.existsByAtendimentoIdAndTipo(atendimento.getId(), TipoCheckpointServico.INICIO)
                || atendimento.getStatus() == StatusAtendimento.EM_EXECUCAO) {
            throw new BusinessException("ATENDIMENTO_JA_INICIADO", "Atendimento ja foi iniciado", HttpStatus.CONFLICT);
        }
        if (atendimento.getStatus() != StatusAtendimento.CONFIRMADO) {
            throw new BusinessException(
                    "ATENDIMENTO_STATUS_INCOMPATIVEL",
                    "Atendimento nao esta confirmado para inicio",
                    HttpStatus.CONFLICT
            );
        }
    }

    private void validarPodeFinalizar(AtendimentoFaxina atendimento) {
        if (checkpointServicoRepository.existsByAtendimentoIdAndTipo(atendimento.getId(), TipoCheckpointServico.FIM)
                || atendimento.getStatus() == StatusAtendimento.FINALIZADO) {
            throw new BusinessException("ATENDIMENTO_JA_FINALIZADO", "Atendimento ja foi finalizado", HttpStatus.CONFLICT);
        }
        if (atendimento.getStatus() == StatusAtendimento.CONFIRMADO
                || atendimento.getStatus() == StatusAtendimento.AGUARDANDO_PAGAMENTO) {
            throw new BusinessException("ATENDIMENTO_NAO_INICIADO", "Atendimento ainda nao foi iniciado", HttpStatus.CONFLICT);
        }
        if (atendimento.getStatus() != StatusAtendimento.EM_EXECUCAO) {
            throw new BusinessException(
                    "ATENDIMENTO_STATUS_INCOMPATIVEL",
                    "Atendimento nao esta em execucao",
                    HttpStatus.CONFLICT
            );
        }
    }

    private void registrarCheckpoint(
            AtendimentoFaxina atendimento,
            Long usuarioId,
            TipoCheckpointServico tipo,
            CheckpointServicoRequest request,
            OffsetDateTime registradoEm
    ) {
        Usuario usuario = usuarioRepository.getReferenceById(usuarioId);
        checkpointServicoRepository.save(new CheckpointServico(
                atendimento,
                tipo,
                usuario,
                request.latitude(),
                request.longitude(),
                request.fotoComprovacaoUrl(),
                request.observacao(),
                registradoEm
        ));
    }

    private Usuario buscarUsuario(Long usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new BusinessException("USUARIO_NOT_FOUND", "Usuario nao encontrado", HttpStatus.NOT_FOUND));
    }

    private Object paraDtoPorPerfil(AtendimentoFaxina atendimento, Usuario usuario) {
        AvaliacaoProfissionalDto avaliacao = buscarAvaliacao(atendimento);
        if (usuario.getTipoUsuario() == TipoUsuario.PROFISSIONAL) {
            return AtendimentoFaxinaMapper.paraProfissionalDto(atendimento, avaliacao, false);
        }

        return AtendimentoFaxinaMapper.paraDto(atendimento, avaliacao, podeAvaliar(atendimento, usuario, avaliacao));
    }

    private AvaliacaoProfissionalDto buscarAvaliacao(AtendimentoFaxina atendimento) {
        if (atendimento.getStatus() != StatusAtendimento.FINALIZADO) {
            return null;
        }

        return avaliacaoProfissionalRepository.findByAtendimentoId(atendimento.getId())
                .map(AvaliacaoProfissionalMapper::paraDto)
                .orElse(null);
    }

    private boolean isAdmin(Usuario usuario) {
        return usuario.getTipoUsuario() == TipoUsuario.ADMIN;
    }

    private boolean podeAvaliar(AtendimentoFaxina atendimento, Usuario usuario, AvaliacaoProfissionalDto avaliacao) {
        return usuario.getTipoUsuario() == TipoUsuario.CLIENTE
                && atendimento.getCliente().getUsuario().getId().equals(usuario.getId())
                && atendimento.getStatus() == StatusAtendimento.FINALIZADO
                && avaliacao == null;
    }
}
