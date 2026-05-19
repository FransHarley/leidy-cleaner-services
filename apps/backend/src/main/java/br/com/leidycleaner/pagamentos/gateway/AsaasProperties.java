package br.com.leidycleaner.pagamentos.gateway;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.asaas")
public class AsaasProperties {

    private String baseUrl = "https://api-sandbox.asaas.com/v3";
    private String apiKey;
    private String webhookToken;
    private String defaultCustomerId;
    private boolean defaultCustomerFallbackEnabled;
    private String paymentBillingType;
    private boolean paymentAutoRedirect = true;
    private boolean paymentCallbackEnabled;
    private List<String> checkoutBillingTypes = List.of("CREDIT_CARD");
    private String checkoutSuccessUrl;
    private String checkoutCancelUrl = "http://localhost:5173/pagamento/cancelado";
    private String checkoutExpiredUrl = "http://localhost:5173/pagamento/expirado";

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getWebhookToken() {
        return webhookToken;
    }

    public void setWebhookToken(String webhookToken) {
        this.webhookToken = webhookToken;
    }

    public String getDefaultCustomerId() {
        return defaultCustomerId;
    }

    public void setDefaultCustomerId(String defaultCustomerId) {
        this.defaultCustomerId = defaultCustomerId;
    }

    public boolean isDefaultCustomerFallbackEnabled() {
        return defaultCustomerFallbackEnabled;
    }

    public void setDefaultCustomerFallbackEnabled(boolean defaultCustomerFallbackEnabled) {
        this.defaultCustomerFallbackEnabled = defaultCustomerFallbackEnabled;
    }

    public String getPaymentBillingType() {
        return paymentBillingType;
    }

    public void setPaymentBillingType(String paymentBillingType) {
        this.paymentBillingType = paymentBillingType;
    }

    public boolean isPaymentAutoRedirect() {
        return paymentAutoRedirect;
    }

    public void setPaymentAutoRedirect(boolean paymentAutoRedirect) {
        this.paymentAutoRedirect = paymentAutoRedirect;
    }

    public boolean isPaymentCallbackEnabled() {
        return paymentCallbackEnabled;
    }

    public void setPaymentCallbackEnabled(boolean paymentCallbackEnabled) {
        this.paymentCallbackEnabled = paymentCallbackEnabled;
    }

    public List<String> getCheckoutBillingTypes() {
        return checkoutBillingTypes;
    }

    public void setCheckoutBillingTypes(List<String> checkoutBillingTypes) {
        this.checkoutBillingTypes = checkoutBillingTypes;
    }

    public String getCheckoutSuccessUrl() {
        return checkoutSuccessUrl;
    }

    public void setCheckoutSuccessUrl(String checkoutSuccessUrl) {
        this.checkoutSuccessUrl = checkoutSuccessUrl;
    }

    public String getCheckoutCancelUrl() {
        return checkoutCancelUrl;
    }

    public void setCheckoutCancelUrl(String checkoutCancelUrl) {
        this.checkoutCancelUrl = checkoutCancelUrl;
    }

    public String getCheckoutExpiredUrl() {
        return checkoutExpiredUrl;
    }

    public void setCheckoutExpiredUrl(String checkoutExpiredUrl) {
        this.checkoutExpiredUrl = checkoutExpiredUrl;
    }
}
