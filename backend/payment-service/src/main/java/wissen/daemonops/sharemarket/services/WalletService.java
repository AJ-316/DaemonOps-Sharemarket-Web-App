package wissen.daemonops.sharemarket.services;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wissen.daemonops.sharemarket.models.Wallet;
import wissen.daemonops.sharemarket.repos.WalletRepo;

import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class WalletService {

    private final WalletRepo walletRepo;
    private final JavaMailSender mailSender;

    public Wallet getOrCreateWallet(Long userId, String email) {
        return walletRepo.findByUserId(userId).orElseGet(() -> {
            Wallet w = Wallet.builder()
                    .userId(userId)
                    .email(email)
                    .balance(BigDecimal.ZERO)
                    .createdAt(LocalDateTime.now())
                    .lastUpdated(LocalDateTime.now())
                    .build();
            return walletRepo.save(w);
        });
    }

    public Wallet getWallet(Long userId) {
        return walletRepo.findByUserId(userId)
                .orElseGet(() -> {
                    Wallet w = Wallet.builder()
                            .userId(userId)
                            .balance(BigDecimal.ZERO)
                            .createdAt(LocalDateTime.now())
                            .lastUpdated(LocalDateTime.now())
                            .build();
                    return walletRepo.save(w);
                });
    }

    /** Called by RazorpayService after successful payment verification */
    public Wallet credit(Long userId, BigDecimal amount) {
        Wallet wallet = getWallet(userId);
        wallet.setBalance(wallet.getBalance().add(amount));
        wallet.setLastUpdated(LocalDateTime.now());
        return walletRepo.save(wallet);
    }

    /** Called by exchange-service via REST for trade deductions */
    public Wallet deduct(Long userId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Amount must be greater than 0");
        Wallet wallet = getWallet(userId);
        if (wallet.getBalance().compareTo(amount) < 0)
            throw new IllegalArgumentException(
                    "Insufficient balance. Available: ₹" + wallet.getBalance().toPlainString());
        wallet.setBalance(wallet.getBalance().subtract(amount));
        wallet.setLastUpdated(LocalDateTime.now());
        return walletRepo.save(wallet);
    }

    /** Withdraw — deduct and send confirmation email */
    public Wallet withdraw(Long userId, BigDecimal amount) {
        Wallet wallet = deduct(userId, amount);
        sendWithdrawalEmail(wallet, amount);
        return wallet;
    }

    private void sendWithdrawalEmail(Wallet wallet, BigDecimal amount) {
        if (wallet.getEmail() == null)
            return;
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true);
            helper.setTo(wallet.getEmail());
            helper.setSubject("Stocko — Withdrawal Confirmation");
            helper.setText(
                    """
                            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0A0A0A;border-radius:16px;border:1px solid #2A2A2A">
                              <h2 style="color:#F59E0B;margin:0 0 8px">Withdrawal Successful</h2>
                              <p style="color:#A3A3A3;font-size:14px;margin:0 0 24px">Your withdrawal has been processed.</p>
                              <div style="background:#161616;border-radius:12px;padding:20px;border:1px solid #2A2A2A">
                                <div style="display:flex;justify-content:space-between;margin-bottom:12px">
                                  <span style="color:#737373;font-size:13px">Amount Withdrawn</span>
                                  <span style="color:#EF4444;font-weight:700;font-size:15px">-₹%s</span>
                                </div>
                                <div style="display:flex;justify-content:space-between">
                                  <span style="color:#737373;font-size:13px">Remaining Balance</span>
                                  <span style="color:#F5F5F5;font-weight:700;font-size:15px">₹%s</span>
                                </div>
                              </div>
                              <p style="color:#525252;font-size:12px;margin:20px 0 0">If you did not initiate this, please contact support immediately.</p>
                            </div>
                            """
                            .formatted(
                                    amount.toPlainString(),
                                    wallet.getBalance().toPlainString()),
                    true);
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("Withdrawal email failed: " + e.getMessage());
        }
    }
}
