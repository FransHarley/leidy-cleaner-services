package br.com.leidycleaner.usuarios.service;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.leidycleaner.usuarios.entity.TipoDocumentoAceite;
import br.com.leidycleaner.usuarios.entity.Usuario;
import br.com.leidycleaner.usuarios.entity.UsuarioAceite;
import br.com.leidycleaner.usuarios.repository.UsuarioAceiteRepository;

@Service
public class UsuarioAceiteService {

    public static final String VERSAO_TERMOS_USO = "2026-05-01";
    public static final String VERSAO_POLITICA_PRIVACIDADE = "2026-05-01";
    public static final String VERSAO_CODIGO_CONDUTA = "2026-05-01";

    private final UsuarioAceiteRepository usuarioAceiteRepository;

    public UsuarioAceiteService(UsuarioAceiteRepository usuarioAceiteRepository) {
        this.usuarioAceiteRepository = usuarioAceiteRepository;
    }

    @Transactional
    public void registrarAceitesObrigatorios(Usuario usuario, String ipOrigem, String userAgent) {
        OffsetDateTime agora = OffsetDateTime.now();

        usuarioAceiteRepository.saveAll(List.of(
                new UsuarioAceite(usuario, TipoDocumentoAceite.TERMOS_USO, VERSAO_TERMOS_USO, agora, ipOrigem, userAgent),
                new UsuarioAceite(usuario, TipoDocumentoAceite.POLITICA_PRIVACIDADE, VERSAO_POLITICA_PRIVACIDADE, agora, ipOrigem, userAgent),
                new UsuarioAceite(usuario, TipoDocumentoAceite.CODIGO_CONDUTA, VERSAO_CODIGO_CONDUTA, agora, ipOrigem, userAgent)
        ));
    }
}
