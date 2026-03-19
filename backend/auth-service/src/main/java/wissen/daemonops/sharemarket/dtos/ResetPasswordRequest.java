package wissen.daemonops.sharemarket.dtos;

public record ResetPasswordRequest(
    String email,
    String oldPassword,
    String newPassword,
    String confirmPassword
) {}
