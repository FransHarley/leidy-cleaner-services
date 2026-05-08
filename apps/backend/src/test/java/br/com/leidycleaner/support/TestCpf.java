package br.com.leidycleaner.support;

import java.util.concurrent.atomic.AtomicInteger;

public final class TestCpf {

    private static final AtomicInteger SEQUENCE = new AtomicInteger(101000000);

    private TestCpf() {
    }

    public static String proximoCpf() {
        return cpfComBase(SEQUENCE.incrementAndGet());
    }

    public static String cpfComPrefixo(String value) {
        String digits = value == null ? "" : value.replaceAll("\\D", "");
        if (digits.length() < 9) {
            digits = String.format("%09d", Integer.parseInt(digits.isBlank() ? "0" : digits));
        }
        return cpfComBase(Integer.parseInt(digits.substring(0, 9)));
    }

    private static String cpfComBase(int baseValue) {
        String base = String.format("%09d", baseValue);
        int primeiroDigito = calcularDigito(base);
        int segundoDigito = calcularDigito(base + primeiroDigito);
        return base + primeiroDigito + segundoDigito;
    }

    private static int calcularDigito(String digits) {
        int soma = 0;
        int pesoInicial = digits.length() + 1;
        for (int index = 0; index < digits.length(); index++) {
            soma += Character.digit(digits.charAt(index), 10) * (pesoInicial - index);
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
