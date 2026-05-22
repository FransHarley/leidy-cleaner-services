package br.com.leidycleaner.notificacoes.service;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import br.com.leidycleaner.notificacoes.dto.TestePushResponse;
import br.com.leidycleaner.notificacoes.entity.DispositivoPush;
import br.com.leidycleaner.notificacoes.provider.EnviarPushCommand;
import br.com.leidycleaner.notificacoes.provider.PushNotificationPayload;
import br.com.leidycleaner.notificacoes.provider.PushNotificationProvider;

@Service
public class NotificacaoPushService {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoPushService.class);

    private final PushNotificationProvider pushNotificationProvider;

    public NotificacaoPushService(PushNotificationProvider pushNotificationProvider) {
        this.pushNotificationProvider = pushNotificationProvider;
    }

    public TestePushResponse enviarTeste(Long usuarioId, List<DispositivoPush> dispositivos) {
        if (dispositivos.isEmpty()) {
            return new TestePushResponse(
                    pushNotificationProvider.isConfigured(),
                    0,
                    0,
                    "Nenhum dispositivo ativo encontrado para teste"
            );
        }

        PushNotificationPayload payload = new PushNotificationPayload(
                "Teste de notificacao",
                "As notificacoes do app profissional estao prontas para uso operacional.",
                Map.of("tipo", "TESTE_PUSH")
        );

        int enviados = 0;
        for (DispositivoPush dispositivo : dispositivos) {
            try {
                var resultado = pushNotificationProvider.enviar(new EnviarPushCommand(
                        usuarioId,
                        dispositivo.getPlataforma(),
                        dispositivo.getToken(),
                        payload
                ));
                if (resultado.enviado()) {
                    enviados += 1;
                }
            } catch (RuntimeException exception) {
                log.warn("Falha ao enviar push de teste para usuarioId={} dispositivoId={}: {}",
                        usuarioId,
                        dispositivo.getId(),
                        exception.getMessage());
            }
        }

        String mensagem = pushNotificationProvider.isConfigured()
                ? "Teste de notificacao processado"
                : "Provider de push ainda nao configurado";
        return new TestePushResponse(pushNotificationProvider.isConfigured(), dispositivos.size(), enviados, mensagem);
    }
}
