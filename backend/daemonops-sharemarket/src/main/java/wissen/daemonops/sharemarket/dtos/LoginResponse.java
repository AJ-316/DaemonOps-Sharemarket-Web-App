package wissen.daemonops.sharemarket.dtos;

import lombok.Data;

@Data
public class LoginResponse {
    private String message;
    private String role;

    public LoginResponse(String message, String role) {
        this.message = message;
        this.role = role;
    }
}