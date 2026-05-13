package br.com.leidycleaner.convites.service;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.leidycleaner.atendimentos.entity.AtendimentoFaxina;
import br.com.leidycleaner.atendimentos.repository.AtendimentoFaxinaRepository;
import br.com.leidycleaner.convites.dto.ConviteRespostaDto;
import br.com.leidycleaner.convites.dto.ConviteProfissionalDto;
import br.com.leidycleaner.convites.entity.ConviteProfissional;
import br.com.leidycleaner.convites.mapper.ConviteProfissionalMapper;
import br.com.leidycleaner.convites.repository.ConviteProfissionalRepository;
import br.com.leidycleaner.core.exception.BusinessException;
import br.com.leidycleaner.profissionais.repository.PerfilProfissionalRepository;
import br.com.leidycleaner.solicitacoes.entity.SolicitacaoFaxina;
import br.com.leidycleaner.solicitacoes.entity.SolicitacaoProfissionalSelecionado;
import br.com.leidycleaner.solicitacoes.entity.StatusSolicitacao;
import br.com.leidycleaner.solicitacoes.repository.SolicitacaoFaxinaRepository;
import br.com.leidycleaner.solicitacoes.repository.SolicitacaoProfissionalSelecionadoRepository;

@Service
public class ConviteProfissionalService {

    private static final int HORAS_PARA_EXPIRAR = 24;

    private final ConviteProfissionalRepository conviteProfissionalRepository;
    private final PerfilProfissionalRepository perfilProfissionalRepository;
    private final SolicitacaoFaxinaRepository solicitacaoFaxinaRepository;
    private final SolicitacaoProfissionalSelecionadoRepository solicitacaoProfissionalSelecionadoRepository;
    private final AtendimentoFaxinaRepository atendimentoFaxinaRepository;
    private final Clock clock;

    public ConviteProfissionalService(
            ConviteProfissionalRepository conviteProfissionalRepository,
            PerfilProfissionalRepository perfilProfissionalRepository,
            SolicitacaoFaxinaRepository solicitacaoFaxinaRepository,
            SolicitacaoProfissionalSelecionadoRepository solicitacaoProfissionalSelecionadoRepository,
            AtendimentoFaxinaRepository atendimentoFaxinaRepository
    ) {
        this.conviteProfissionalRepository = conviteProfissionalRepository;
        this.perfilProfissionalRepository = perfilProfissionalRepository;
        this.solicitacaoFaxinaRepository = solicitacaoFaxinaRepository;
        this.solicitacaoProfissionalSelecionadoRepository = solicitacaoProfissionalSelecionadoRepository;
        this.atendimentoFaxinaRepository = atendimentoFaxinaRepository;
        this.clock = Clock.systemDefaultZone();
    }

    public List<ConviteProfissional> substituirConvitesDaSolicitacao(
            SolicitacaoFaxina solicitacao,
            List<SolicitacaoProfissionalSelecionado> selecionados
    ) {
        conviteProfissionalRepository.deleteBySolicitacaoId(solicitacao.getId());
        conviteProfissionalRepository.flush();

        OffsetDateTime enviadoEm = OffsetDateTime.now(clock);
        OffsetDateTime expiraEm = enviadoEm.plusHours(HORAS_PARA_EXPIRAR);
        List<ConviteProfissional> convites = selecionados.stream()
                .map(selecionado -> new ConviteProfissional(
                        solicitacao,
                        selecionado.getProfissional(),
                        enviadoEm,
                        expiraEm
                ))
                .toList();
        return conviteProfissionalRepository.saveAll(convites);
    }

    @Transactional
    public ConviteProfissional criarConviteParaSolicitacaoPaga(SolicitacaoFaxina solicitacao) {
        validarSolicitacaoElegivelParaConvitePago(solicitacao);

        List<SolicitacaoProfissionalSelecionado> selecionados = solicitacaoProfissionalSelecionadoRepository
                .findBySolicitacaoIdOrderByOrdemEscolhaAsc(solicitacao.getId());
        if (selecionados.size() != 1) {
            throw new BusinessException(
                    "SOLICITACAO_PROFISSIONAL_SELECIONADA_INVALIDA",
                    "Solicitacao paga deve ter exatamente uma profissional selecionada para envio de convite",
                    HttpStatus.CONFLICT
            );
        }

        SolicitacaoProfissionalSelecionado selecionado = selecionados.getFirst();
        Long profissionalId = selecionado.getProfissional().getId();
        return conviteProfissionalRepository
                .findBySolicitacaoIdAndProfissionalId(solicitacao.getId(), profissionalId)
                .map(conviteExistente -> {
                    solicitacao.marcarPagaAguardandoAceite();
                    return conviteExistente;
                })
                .orElseGet(() -> criarPrimeiroConviteParaSolicitacaoPaga(solicitacao, selecionado));
    }

    @Transactional(readOnly = true)
    public List<ConviteProfissionalDto> listarMeus(Long usuarioId) {
        validarPerfilProfissional(usuarioId);
        return conviteProfissionalRepository.findByProfissionalUsuarioIdOrderByEnviadoEmDescIdDesc(usuarioId)
                .stream()
                .map(ConviteProfissionalMapper::paraDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ConviteProfissionalDto buscarMeu(Long usuarioId, Long conviteId) {
        validarPerfilProfissional(usuarioId);
        return conviteProfissionalRepository.findByIdAndProfissionalUsuarioId(conviteId, usuarioId)
                .map(ConviteProfissionalMapper::paraDto)
                .orElseThrow(() -> new BusinessException("CONVITE_NOT_FOUND", "Convite nao encontrado", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public ConviteRespostaDto aceitar(Long usuarioId, Long conviteId) {
        validarPerfilProfissional(usuarioId);
        Long solicitacaoId = conviteProfissionalRepository
                .findSolicitacaoIdByIdAndProfissionalUsuarioId(conviteId, usuarioId)
                .orElseThrow(() -> new BusinessException("CONVITE_NOT_FOUND", "Convite nao encontrado", HttpStatus.NOT_FOUND));
        SolicitacaoFaxina solicitacao = solicitacaoFaxinaRepository.findByIdForUpdate(solicitacaoId)
                .orElseThrow(() -> new BusinessException("SOLICITACAO_NOT_FOUND", "Solicitacao nao encontrada", HttpStatus.NOT_FOUND));
        ConviteProfissional convite = conviteProfissionalRepository
                .findByIdAndProfissionalUsuarioIdForUpdate(conviteId, usuarioId)
                .orElseThrow(() -> new BusinessException("CONVITE_NOT_FOUND", "Convite nao encontrado", HttpStatus.NOT_FOUND));

        validarConvitePertenceASolicitacao(convite, solicitacao);
        validarConviteRespondivel(convite);
        validarConviteNaoExpirado(convite);
        validarSolicitacaoAceitavel(solicitacao);
        validarAtendimentoAindaNaoCriado(solicitacao);

        OffsetDateTime agora = OffsetDateTime.now(clock);
        convite.aceitar(agora);
        conviteProfissionalRepository.findBySolicitacaoId(solicitacao.getId())
                .stream()
                .filter(outroConvite -> !outroConvite.getId().equals(convite.getId()))
                .forEach(outroConvite -> outroConvite.cancelar(agora));
        solicitacao.marcarAceita();

        AtendimentoFaxina atendimento = atendimentoFaxinaRepository.save(
                new AtendimentoFaxina(solicitacao, convite.getProfissional())
        );

        return new ConviteRespostaDto(
                convite.getId(),
                convite.getStatus(),
                solicitacao.getId(),
                solicitacao.getStatus(),
                atendimento.getId(),
                atendimento.getStatus()
        );
    }

    @Transactional
    public ConviteRespostaDto recusar(Long usuarioId, Long conviteId) {
        validarPerfilProfissional(usuarioId);
        ConviteProfissional convite = conviteProfissionalRepository
                .findByIdAndProfissionalUsuarioIdForUpdate(conviteId, usuarioId)
                .orElseThrow(() -> new BusinessException("CONVITE_NOT_FOUND", "Convite nao encontrado", HttpStatus.NOT_FOUND));

        validarConviteRespondivel(convite);
        validarConviteNaoExpirado(convite);

        OffsetDateTime agora = OffsetDateTime.now(clock);
        convite.recusar(agora);
        SolicitacaoFaxina solicitacao = convite.getSolicitacao();
        return new ConviteRespostaDto(
                convite.getId(),
                convite.getStatus(),
                solicitacao.getId(),
                solicitacao.getStatus(),
                null,
                null
        );
    }

    private void validarPerfilProfissional(Long usuarioId) {
        if (perfilProfissionalRepository.findByUsuarioId(usuarioId).isEmpty()) {
            throw new AccessDeniedException("Usuario autenticado nao possui perfil profissional");
        }
    }

    private void validarConvitePertenceASolicitacao(ConviteProfissional convite, SolicitacaoFaxina solicitacao) {
        if (!convite.getSolicitacao().getId().equals(solicitacao.getId())) {
            throw new BusinessException("CONVITE_SOLICITACAO_INVALIDA", "Convite nao pertence a solicitacao bloqueada", HttpStatus.CONFLICT);
        }
    }

    private void validarConviteRespondivel(ConviteProfissional convite) {
        if (!convite.podeResponder()) {
            throw new BusinessException("CONVITE_STATUS_INCOMPATIVEL", "Convite nao esta disponivel para resposta", HttpStatus.CONFLICT);
        }
    }

    private void validarConviteNaoExpirado(ConviteProfissional convite) {
        OffsetDateTime agora = OffsetDateTime.now(clock);
        if (convite.expiradoEm(agora)) {
            throw new BusinessException("CONVITE_EXPIRADO", "Convite expirado", HttpStatus.CONFLICT);
        }
    }

    private void validarSolicitacaoAceitavel(SolicitacaoFaxina solicitacao) {
        if (solicitacao.getStatus() != StatusSolicitacao.CONVITES_ENVIADOS
                && solicitacao.getStatus() != StatusSolicitacao.AGUARDANDO_ACEITE) {
            throw new BusinessException("SOLICITACAO_STATUS_INCOMPATIVEL", "Solicitacao nao esta aberta para aceite", HttpStatus.CONFLICT);
        }
    }

    private void validarSolicitacaoElegivelParaConvitePago(SolicitacaoFaxina solicitacao) {
        if (solicitacao.getStatus() != StatusSolicitacao.AGUARDANDO_PAGAMENTO
                && solicitacao.getStatus() != StatusSolicitacao.PAGA_AGUARDANDO_ACEITE) {
            throw new BusinessException(
                    "SOLICITACAO_STATUS_INCOMPATIVEL",
                    "Solicitacao nao esta em status compativel com envio de convite apos pagamento",
                    HttpStatus.CONFLICT
            );
        }
    }

    private ConviteProfissional criarPrimeiroConviteParaSolicitacaoPaga(
            SolicitacaoFaxina solicitacao,
            SolicitacaoProfissionalSelecionado selecionado
    ) {
        if (conviteProfissionalRepository.existsBySolicitacaoId(solicitacao.getId())) {
            throw new BusinessException(
                    "CONVITE_SOLICITACAO_INCONSISTENTE",
                    "Solicitacao paga ja possui convite para profissional diferente da selecionada",
                    HttpStatus.CONFLICT
            );
        }

        OffsetDateTime enviadoEm = OffsetDateTime.now(clock);
        ConviteProfissional convite = new ConviteProfissional(
                solicitacao,
                selecionado.getProfissional(),
                enviadoEm,
                enviadoEm.plusHours(HORAS_PARA_EXPIRAR)
        );
        solicitacao.marcarPagaAguardandoAceite();
        return conviteProfissionalRepository.save(convite);
    }

    private void validarAtendimentoAindaNaoCriado(SolicitacaoFaxina solicitacao) {
        if (atendimentoFaxinaRepository.existsBySolicitacaoId(solicitacao.getId())) {
            throw new BusinessException("ATENDIMENTO_JA_CRIADO", "Solicitacao ja possui atendimento criado", HttpStatus.CONFLICT);
        }
    }
}
