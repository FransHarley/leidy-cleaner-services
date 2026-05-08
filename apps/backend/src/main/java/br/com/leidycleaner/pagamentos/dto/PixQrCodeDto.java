package br.com.leidycleaner.pagamentos.dto;

public record PixQrCodeDto(
        String encodedImage,
        String payload,
        String expirationDate
) {
}
