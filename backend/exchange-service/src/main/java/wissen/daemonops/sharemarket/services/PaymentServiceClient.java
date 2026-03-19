package wissen.daemonops.sharemarket.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.Map;

/**
 * REST client that talks to the payment-service (port 8084) for all
 * wallet operations: getWallet, deduct, credit.
 *
 * This replaces the old local WalletService calls from exchange-service.
 */
@Service
public class PaymentServiceClient {

    private final RestTemplate restTemplate;
    private final String paymentServiceUrl;

    public PaymentServiceClient(
            @Value("${payment.service.url:http://localhost:8084}") String paymentServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.paymentServiceUrl = paymentServiceUrl;
    }

    private HttpHeaders headers(Long userId) {
        HttpHeaders h = new HttpHeaders();
        h.set("X-User-Id", userId.toString());
        return h;
    }

    public Map getWallet(Long userId) {
        String url = paymentServiceUrl + "/wallet";
        ResponseEntity<Map> resp = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(headers(userId)), Map.class);
        return resp.getBody();
    }

    public BigDecimal getBalance(Long userId) {
        Map wallet = getWallet(userId);
        if (wallet == null)
            return BigDecimal.ZERO;
        Object bal = wallet.get("balance");
        if (bal == null)
            return BigDecimal.ZERO;
        return new BigDecimal(bal.toString());
    }

    public void deduct(Long userId, BigDecimal amount) {
        String url = UriComponentsBuilder
                .fromUriString(paymentServiceUrl + "/wallet/deduct")
                .queryParam("amount", amount.toPlainString())
                .toUriString();
        ResponseEntity<Map> resp = restTemplate.exchange(
                url, HttpMethod.POST, new HttpEntity<>(headers(userId)), Map.class);
        if (!resp.getStatusCode().is2xxSuccessful()) {
            Map body = resp.getBody();
            String msg = body != null ? (String) body.get("message") : "Wallet deduction failed";
            throw new IllegalArgumentException(msg);
        }
    }

    public void credit(Long userId, BigDecimal amount) {
        String url = UriComponentsBuilder
                .fromUriString(paymentServiceUrl + "/wallet/credit")
                .queryParam("amount", amount.toPlainString())
                .toUriString();
        restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers(userId)), Map.class);
    }
}
