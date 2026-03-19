package wissen.daemonops.sharemarket.dtos;

public record LoginResponse(
        String token, String role, Long userId, String email) {
}