package br.com.leidycleaner.pagamentos.gateway;

public interface AsaasGatewayClient {

    AsaasCustomerGatewayResponse criarCliente(AsaasCustomerRequest request);

    AsaasPagamentoGatewayResponse criarCobranca(AsaasCobrancaRequest request);

    AsaasPagamentoGatewayResponse consultarPagamento(String gatewayPaymentId);

    AsaasCheckoutGatewayResponse criarCheckout(AsaasCheckoutRequest request);

    AsaasPixQrCodeGatewayResponse consultarPixQrCode(String gatewayPaymentId);
}
