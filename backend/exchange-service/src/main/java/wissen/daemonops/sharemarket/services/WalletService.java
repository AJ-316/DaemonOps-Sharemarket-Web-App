package wissen.daemonops.sharemarket.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wissen.daemonops.sharemarket.models.Wallet;
import wissen.daemonops.sharemarket.repos.WalletRepo;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepo walletRepo;

    public Wallet createWallet(Long userId) {
        Wallet wallet = Wallet.builder()
                .userId(userId)
                .balance(BigDecimal.ZERO)  // start at 0, user deposits manually
                .createdAt(LocalDateTime.now())
                .lastUpdated(LocalDateTime.now())
                .build();
        return walletRepo.save(wallet);
    }

    // FIX: was orElseThrow → caused 500 if wallet not yet created.
    // Now auto-creates a ₹0 wallet so GET /wallet never fails.
    public Wallet getWallet(Long userId) {
        return walletRepo.findByUserId(userId)
                .orElseGet(() -> createWallet(userId));
    }

    public Wallet deposit(Long userId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Amount must be greater than 0");
        Wallet wallet = getWallet(userId);
        wallet.setBalance(wallet.getBalance().add(amount));
        wallet.setLastUpdated(LocalDateTime.now());
        return walletRepo.save(wallet);
    }

    public Wallet deduct(Long userId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Amount must be greater than 0");
        Wallet wallet = getWallet(userId);
        if (wallet.getBalance().compareTo(amount) < 0)
            throw new IllegalArgumentException("Insufficient balance. Available: ₹" + wallet.getBalance().toPlainString());
        wallet.setBalance(wallet.getBalance().subtract(amount));
        wallet.setLastUpdated(LocalDateTime.now());
        return walletRepo.save(wallet);
    }

    public Wallet credit(Long userId, BigDecimal amount) {
        Wallet wallet = getWallet(userId);
        wallet.setBalance(wallet.getBalance().add(amount));
        wallet.setLastUpdated(LocalDateTime.now());
        return walletRepo.save(wallet);
    }
}