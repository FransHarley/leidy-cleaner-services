package br.com.leidycleaner.pagamentos.gateway;

public record AsaasPixQrCodeGatewayResponse(
        String encodedImage,
        String payload,
        String expirationDate
) {
}
