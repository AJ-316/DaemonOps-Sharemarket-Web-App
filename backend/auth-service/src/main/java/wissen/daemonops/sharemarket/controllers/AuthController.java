package wissen.daemonops.sharemarket.controllers;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import wissen.daemonops.sharemarket.dtos.LoginRequest;
import wissen.daemonops.sharemarket.dtos.LoginResponse;
import wissen.daemonops.sharemarket.dtos.RegisterRequestDto;
import wissen.daemonops.sharemarket.services.AuthService;

@RestController
// @CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    AuthController(AuthService authService) {
        this.authService = authService;
    }

    // @PostMapping("/login")
    // public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request)
    // {
    // return ResponseEntity.ok(authService.login(request));
    // }

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

    // @PostMapping("/register")
    // public ResponseEntity<String> registerUser() {
    // return ResponseEntity.ok("Test");
    // }

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

}
