package wissen.daemonops.sharemarket.services;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Service
public class RazorpayService {

    private final String keyId;
    private final String keySecret;
    private final WalletService walletService;

    public RazorpayService(
            @Value("${razorpay.key.id}") String keyId,
            @Value("${razorpay.key.secret}") String keySecret,
            WalletService walletService) {
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.walletService = walletService;
    }

    /**
     * Creates a Razorpay order.
     * 
     * @param amountINR amount in INR (e.g. 500.00)
     */
    public Map<String, Object> createOrder(BigDecimal amountINR) throws RazorpayException {
        RazorpayClient client = new RazorpayClient(keyId, keySecret);
        JSONObject params = new JSONObject();
        // Razorpay expects amount in paise (1 INR = 100 paise)
        params.put("amount", amountINR.multiply(BigDecimal.valueOf(100)).intValue());
        params.put("currency", "INR");
        params.put("receipt", "rcpt_" + System.currentTimeMillis());

        Order order = client.orders.create(params);
        return Map.of(
                "orderId", order.get("id").toString(),
                "amount", order.get("amount").toString(),
                "currency", order.get("currency").toString(),
                "key", keyId);
    }

    /**
     * Verifies the Razorpay payment signature.
     * If valid, credits the wallet.
     */
    public void verifyAndCredit(Long userId, String razorpayOrderId,
            String razorpayPaymentId, String razorpaySignature,
            BigDecimal amountINR) throws Exception {

        JSONObject attributes = new JSONObject();
        attributes.put("razorpay_order_id", razorpayOrderId);
        attributes.put("razorpay_payment_id", razorpayPaymentId);
        attributes.put("razorpay_signature", razorpaySignature);

        boolean isValid = Utils.verifyPaymentSignature(attributes, keySecret);

        if (!isValid) {
            throw new SecurityException("Payment signature verification failed.");
        }

        walletService.credit(userId, amountINR);
    }
}
