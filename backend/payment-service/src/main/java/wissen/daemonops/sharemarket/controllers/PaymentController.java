package wissen.daemonops.sharemarket.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import wissen.daemonops.sharemarket.services.RazorpayService;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final RazorpayService razorpayService;

    /**
     * Step 1: Create a Razorpay order.
     * POST /payment/create-order?amount=500
     * Returns { orderId, amount, currency, key }
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(
            @RequestParam BigDecimal amount) {
        try {
            Map<String, Object> order = razorpayService.createOrder(amount);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Step 2: Verify Razorpay payment and credit the wallet.
     * POST /payment/verify
     * Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount }
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Map<String, Object> body) {
        try {
            BigDecimal amount = new BigDecimal(body.get("amount").toString());
            razorpayService.verifyAndCredit(
                    userId,
                    body.get("razorpayOrderId").toString(),
                    body.get("razorpayPaymentId").toString(),
                    body.get("razorpaySignature").toString(),
                    amount);
            return ResponseEntity.ok(Map.of("message", "Payment verified. Wallet credited."));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
