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

    // Create wallet when user registers
    public Wallet createWallet(Long userId) {
        Wallet wallet = Wallet.builder()
                .userId(userId)
                .balance(BigDecimal.valueOf(10000))
                .createdAt(LocalDateTime.now())
                .lastUpdated(LocalDateTime.now())
                .build();
        return walletRepo.save(wallet);
    }

    public Wallet getWallet(Long userId) {
        return walletRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
    }

    public Wallet deposit(Long userId, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }
        Wallet wallet = getWallet(userId);
        wallet.setBalance(wallet.getBalance().add(amount));
        wallet.setLastUpdated(LocalDateTime.now());
        return walletRepo.save(wallet);
    }

    // Deduct money (when buying stock)
    public Wallet deduct(Long userId, BigDecimal amount) {
        Wallet wallet = getWallet(userId);
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient balance");
        }
        wallet.setBalance(wallet.getBalance().subtract(amount));
        wallet.setLastUpdated(LocalDateTime.now());
        return walletRepo.save(wallet);
    }

    // Add money (when selling stock)
    public Wallet credit(Long userId, BigDecimal amount) {
        Wallet wallet = getWallet(userId);
        wallet.setBalance(wallet.getBalance().add(amount));
        wallet.setLastUpdated(LocalDateTime.now());
        return walletRepo.save(wallet);
    }
}
