package br.com.leidycleaner.profissionais.service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.leidycleaner.core.exception.BusinessException;
import br.com.leidycleaner.profissionais.dto.DefinirRegioesProfissionalRequest;
import br.com.leidycleaner.profissionais.dto.DisponibilidadeProfissionalDto;
import br.com.leidycleaner.profissionais.dto.DisponibilidadeProfissionalRequest;
import br.com.leidycleaner.profissionais.entity.DisponibilidadeProfissional;
import br.com.leidycleaner.profissionais.entity.PerfilProfissional;
import br.com.leidycleaner.profissionais.entity.ProfissionalRegiao;
import br.com.leidycleaner.profissionais.mapper.DisponibilidadeProfissionalMapper;
import br.com.leidycleaner.profissionais.repository.DisponibilidadeProfissionalRepository;
import br.com.leidycleaner.profissionais.repository.ProfissionalRegiaoRepository;
import br.com.leidycleaner.regioes.dto.RegiaoAtendimentoDto;
import br.com.leidycleaner.regioes.mapper.RegiaoAtendimentoMapper;
import br.com.leidycleaner.regioes.repository.RegiaoAtendimentoRepository;

@Service
public class ProfissionalOnboardingService {

    private final PerfilProfissionalService perfilProfissionalService;
    private final RegiaoAtendimentoRepository regiaoAtendimentoRepository;
    private final ProfissionalRegiaoRepository profissionalRegiaoRepository;
    private final DisponibilidadeProfissionalRepository disponibilidadeProfissionalRepository;

    public ProfissionalOnboardingService(
            PerfilProfissionalService perfilProfissionalService,
            RegiaoAtendimentoRepository regiaoAtendimentoRepository,
            ProfissionalRegiaoRepository profissionalRegiaoRepository,
            DisponibilidadeProfissionalRepository disponibilidadeProfissionalRepository
    ) {
        this.perfilProfissionalService = perfilProfissionalService;
        this.regiaoAtendimentoRepository = regiaoAtendimentoRepository;
        this.profissionalRegiaoRepository = profissionalRegiaoRepository;
        this.disponibilidadeProfissionalRepository = disponibilidadeProfissionalRepository;
    }

    @Transactional
    public List<RegiaoAtendimentoDto> definirMinhasRegioes(Long usuarioId, DefinirRegioesProfissionalRequest request) {
        PerfilProfissional perfil = perfilProfissionalService.buscarPerfilDaProfissional(usuarioId);
        Set<Long> regiaoIds = request.regiaoIds();
        var regioes = regiaoAtendimentoRepository.findByIdInAndAtivoTrue(regiaoIds);
        if (regioes.size() != regiaoIds.size()) {
            throw new BusinessException("REGIAO_INVALIDA", "Uma ou mais regioes nao existem ou estao inativas", HttpStatus.BAD_REQUEST);
        }

        List<ProfissionalRegiao> associacoesAtuais = profissionalRegiaoRepository.findByProfissionalIdOrderByRegiaoNomeAsc(perfil.getId());
        Set<Long> idsAtuais = associacoesAtuais.stream()
                .map(associacao -> associacao.getRegiao().getId())
                .collect(Collectors.toSet());

        List<ProfissionalRegiao> associacoesRemovidas = associacoesAtuais.stream()
                .filter(associacao -> !regiaoIds.contains(associacao.getRegiao().getId()))
                .toList();
        profissionalRegiaoRepository.deleteAll(associacoesRemovidas);

        var novasAssociacoes = regioes.stream()
                .filter(regiao -> !idsAtuais.contains(regiao.getId()))
                .map(regiao -> new ProfissionalRegiao(perfil, regiao))
                .toList();
        profissionalRegiaoRepository.saveAll(novasAssociacoes);
        return listarMinhasRegioes(usuarioId);
    }

    @Transactional(readOnly = true)
    public List<RegiaoAtendimentoDto> listarMinhasRegioes(Long usuarioId) {
        PerfilProfissional perfil = perfilProfissionalService.buscarPerfilDaProfissional(usuarioId);
        return profissionalRegiaoRepository.findByProfissionalIdOrderByRegiaoNomeAsc(perfil.getId())
                .stream()
                .map(ProfissionalRegiao::getRegiao)
                .map(RegiaoAtendimentoMapper::paraDto)
                .toList();
    }

    @Transactional
    public DisponibilidadeProfissionalDto criarDisponibilidade(Long usuarioId, DisponibilidadeProfissionalRequest request) {
        PerfilProfissional perfil = perfilProfissionalService.buscarPerfilDaProfissional(usuarioId);
        validarHorario(request);
        DisponibilidadeProfissional disponibilidade = disponibilidadeProfissionalRepository.save(new DisponibilidadeProfissional(
                perfil,
                request.diaSemana(),
                request.horaInicio(),
                request.horaFim(),
                request.ativo() == null || request.ativo()
        ));
        return DisponibilidadeProfissionalMapper.paraDto(disponibilidade);
    }

    @Transactional(readOnly = true)
    public List<DisponibilidadeProfissionalDto> listarDisponibilidades(Long usuarioId) {
        PerfilProfissional perfil = perfilProfissionalService.buscarPerfilDaProfissional(usuarioId);
        return disponibilidadeProfissionalRepository.findByProfissionalIdOrderByDiaSemanaAscHoraInicioAsc(perfil.getId())
                .stream()
                .map(DisponibilidadeProfissionalMapper::paraDto)
                .toList();
    }

    @Transactional
    public DisponibilidadeProfissionalDto atualizarDisponibilidade(Long usuarioId, Long disponibilidadeId, DisponibilidadeProfissionalRequest request) {
        PerfilProfissional perfil = perfilProfissionalService.buscarPerfilDaProfissional(usuarioId);
        validarHorario(request);
        DisponibilidadeProfissional disponibilidade = disponibilidadeProfissionalRepository.findByIdAndProfissionalId(disponibilidadeId, perfil.getId())
                .orElseThrow(() -> new BusinessException("DISPONIBILIDADE_NOT_FOUND", "Disponibilidade nao encontrada", HttpStatus.NOT_FOUND));
        disponibilidade.atualizar(
                request.diaSemana(),
                request.horaInicio(),
                request.horaFim(),
                request.ativo() == null || request.ativo()
        );
        return DisponibilidadeProfissionalMapper.paraDto(disponibilidade);
    }

    @Transactional
    public void excluirDisponibilidade(Long usuarioId, Long disponibilidadeId) {
        PerfilProfissional perfil = perfilProfissionalService.buscarPerfilDaProfissional(usuarioId);
        DisponibilidadeProfissional disponibilidade = disponibilidadeProfissionalRepository.findByIdAndProfissionalId(disponibilidadeId, perfil.getId())
                .orElseThrow(() -> new BusinessException("DISPONIBILIDADE_NOT_FOUND", "Disponibilidade nao encontrada", HttpStatus.NOT_FOUND));
        disponibilidadeProfissionalRepository.delete(disponibilidade);
    }

    private void validarHorario(DisponibilidadeProfissionalRequest request) {
        if (!request.horaFim().isAfter(request.horaInicio())) {
            throw new BusinessException("HORARIO_INVALIDO", "horaFim deve ser posterior a horaInicio", HttpStatus.BAD_REQUEST);
        }
    }
}
