package wissen.daemonops.sharemarket.controllers;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import wissen.daemonops.sharemarket.dtos.LoginRequest;
import wissen.daemonops.sharemarket.dtos.LoginResponse;
import wissen.daemonops.sharemarket.dtos.RegisterRequestDto;
import wissen.daemonops.sharemarket.dtos.ResetPasswordRequest;
import wissen.daemonops.sharemarket.models.User;
import wissen.daemonops.sharemarket.services.AuthService;

@RestController
// @CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest request) {
        try {
            LoginResponse result = authService.login(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequestDto dto) {
        try {
            String result = authService.register(dto);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(409).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok("Password reset successfully.");
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
        @RequestBody Map<String, String> request,
        @RequestHeader("X-User-Id") Long userId) {
    try {
        User user = authService.getUserById(userId);
        authService.resetPassword(new ResetPasswordRequest(
            user.getEmail(),
            request.get("currentPassword"),
            request.get("newPassword"),
            request.get("newPassword")  // frontend already validates match
        ));
        return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
    } catch (Exception e) {
        return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
    }
}

}
