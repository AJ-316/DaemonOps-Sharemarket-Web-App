package wissen.daemonops.sharemarket.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import wissen.daemonops.sharemarket.models.Wallet;
import wissen.daemonops.sharemarket.services.WalletService;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    /** GET /wallet — returns current balance */
    @GetMapping
    public ResponseEntity<Wallet> getWallet(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(walletService.getWallet(userId));
    }

    /**
     * POST /wallet/deduct — called internally by exchange-service for trade
     * deductions
     */
    @PostMapping("/deduct")
    public ResponseEntity<?> deduct(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam BigDecimal amount) {
        try {
            return ResponseEntity.ok(walletService.deduct(userId, amount));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * POST /wallet/credit — called internally by exchange-service for sell credits
     */
    @PostMapping("/credit")
    public ResponseEntity<Wallet> credit(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam BigDecimal amount) {
        return ResponseEntity.ok(walletService.credit(userId, amount));
    }

    /** POST /wallet/withdraw — user-initiated withdrawal with SMTP notification */
    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam BigDecimal amount) {
        try {
            return ResponseEntity.ok(walletService.withdraw(userId, amount));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * POST /wallet/set-email — called once on first deposit to store email for
     * notifications
     */
    @PostMapping("/set-email")
    public ResponseEntity<Void> setEmail(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam String email) {
        Wallet wallet = walletService.getWallet(userId);
        wallet.setEmail(email);
        walletService.credit(userId, BigDecimal.ZERO); // triggers a save
        return ResponseEntity.ok().build();
    }
}
