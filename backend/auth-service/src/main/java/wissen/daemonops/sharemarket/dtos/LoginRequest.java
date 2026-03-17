package wissen.daemonops.sharemarket.dtos;


public record LoginRequest(
        String email,
        String password
) {
}
