package br.com.leidycleaner.pagamentos.gateway;

public record AsaasCustomerRequest(
        String name,
        String email,
        String phone,
        String mobilePhone,
        String cpfCnpj
) {
}
