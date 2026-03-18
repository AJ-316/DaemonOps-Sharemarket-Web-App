package wissen.daemonops.sharemarket.controllers;

import java.math.BigDecimal;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import wissen.daemonops.sharemarket.models.Wallet;
import wissen.daemonops.sharemarket.services.WalletService;

@RestController
@RequestMapping("/wallet")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public ResponseEntity<Wallet> getWallet(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(walletService.getWallet(userId));
    }

    @PostMapping("/deposit")
    public ResponseEntity<Wallet> deposit(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam BigDecimal amount) {
        return ResponseEntity.ok(walletService.deposit(userId, amount));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<Wallet> withdraw(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam BigDecimal amount) {
        return ResponseEntity.ok(walletService.deduct(userId, amount));
    }
}