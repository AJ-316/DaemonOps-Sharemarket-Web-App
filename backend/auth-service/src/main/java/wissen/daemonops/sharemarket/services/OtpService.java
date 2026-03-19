package wissen.daemonops.sharemarket.services;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import wissen.daemonops.sharemarket.models.OtpRecord;
import wissen.daemonops.sharemarket.models.User;
import wissen.daemonops.sharemarket.repos.OtpRepo;
import wissen.daemonops.sharemarket.repos.UserRepo;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepo otpRepo;
    private final UserRepo userRepo;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

    // ── Step 1: Generate and send OTP ────────────────────────────────────────
    public void sendOtp(String email) {
        if (!userRepo.existsByEmail(email)) {
            throw new IllegalArgumentException("Email not found. Please check your email address.");
        }

        String otp = String.format("%06d", new Random().nextInt(999999));

        OtpRecord record = OtpRecord.builder()
                .email(email)
                .otp(otp)
                .expiresAt(LocalDateTime.now().plusSeconds(60))
                .used(false)
                .build();
        otpRepo.save(record);

        sendEmail(email, otp);
    }

    // ── Step 2: Verify OTP ───────────────────────────────────────────────────
    public void verifyOtp(String email, String otp) {
        OtpRecord record = otpRepo.findTopByEmailOrderByIdDesc(email)
                .orElseThrow(() -> new IllegalArgumentException("No OTP found for this email."));

        if (record.isUsed()) {
            throw new IllegalArgumentException("OTP already used. Please request a new one.");
        }
        if (LocalDateTime.now().isAfter(record.getExpiresAt())) {
            throw new IllegalArgumentException("OTP expired. Please request a new one.");
        }
        if (!record.getOtp().equals(otp)) {
            throw new IllegalArgumentException("Invalid OTP.");
        }

        // Mark used so it cannot be replayed
        record.setUsed(true);
        otpRepo.save(record);
    }

    // ── Step 3: Reset password (no old password required) ───────────────────
    public void resetPasswordWithOtp(String email, String newPassword) {
        // Ensure there is a recent (used) OTP — prevents skipping step 2
        OtpRecord record = otpRepo.findTopByEmailOrderByIdDesc(email)
                .orElseThrow(() -> new IllegalArgumentException("OTP verification required."));
        if (!record.isUsed()) {
            throw new IllegalArgumentException("Please verify your OTP first.");
        }

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);
    }

    // ── Mail sender ──────────────────────────────────────────────────────────
    private void sendEmail(String to, String otp) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true);
            helper.setTo(to);
            helper.setSubject("Stocko — Your Password Reset OTP");
            helper.setText(
                    """
                            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0A0A0A;border-radius:16px;border:1px solid #2A2A2A">
                              <h2 style="color:#F59E0B;margin:0 0 8px">Password Reset</h2>
                              <p style="color:#A3A3A3;font-size:14px;margin:0 0 24px">Enter this OTP within <strong style="color:#F5F5F5">60 seconds</strong></p>
                              <div style="background:#161616;border-radius:12px;padding:24px;text-align:center;border:1px solid #2A2A2A">
                                <span style="font-size:40px;font-weight:900;letter-spacing:16px;color:#F5F5F5">%s</span>
                              </div>
                              <p style="color:#525252;font-size:12px;margin:20px 0 0">If you didn't request this, ignore this email. Your account is safe.</p>
                            </div>
                            """
                            .formatted(otp),
                    true);
            mailSender.send(msg);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }
}
