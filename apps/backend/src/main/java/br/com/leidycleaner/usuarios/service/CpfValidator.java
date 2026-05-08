package br.com.leidycleaner.usuarios.service;

import org.springframework.http.HttpStatus;

import br.com.leidycleaner.core.exception.BusinessException;

public final class CpfValidator {

    private CpfValidator() {
    }

    public static String normalizarEValidar(String cpf) {
        String cpfNormalizado = cpf == null ? "" : cpf.replaceAll("\\D", "");

        if (!isValido(cpfNormalizado)) {
            throw new BusinessException("CPF_INVALIDO", "CPF inv\u00e1lido.", HttpStatus.BAD_REQUEST);
        }

        return cpfNormalizado;
    }

    public static boolean isValido(String cpf) {
        if (cpf == null || cpf.length() != 11 || cpf.chars().distinct().count() == 1) {
            return false;
        }

        return calcularDigito(cpf, 9) == Character.digit(cpf.charAt(9), 10)
                && calcularDigito(cpf, 10) == Character.digit(cpf.charAt(10), 10);
    }

    private static int calcularDigito(String cpf, int quantidadeDigitos) {
        int soma = 0;

        for (int indice = 0; indice < quantidadeDigitos; indice++) {
            soma += Character.digit(cpf.charAt(indice), 10) * (quantidadeDigitos + 1 - indice);
        }

        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
