package wissen.daemonops.sharemarket.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import wissen.daemonops.sharemarket.config.JwtService;
import wissen.daemonops.sharemarket.dtos.LoginRequest;
import wissen.daemonops.sharemarket.dtos.LoginResponse;
import wissen.daemonops.sharemarket.models.User;
import wissen.daemonops.sharemarket.repos.UserDetailsRepository;
import wissen.daemonops.sharemarket.repos.UserRepo;

@Service
public class AuthService {

    private final JwtService jwtService;
    private final UserRepo userRepository;
    private final UserDetailsRepository userDetailsRepository;
    private final PasswordEncoder passwordEncoder;

    private final AuthenticationManager authenticationManager;

    public AuthService(JwtService jwtService, UserRepo userRepository, UserDetailsRepository userDetailsRepository, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.userDetailsRepository = userDetailsRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    public LoginResponse login(LoginRequest request) {
        if (!userRepository.existsByEmail(request.email())) {
            throw new BadCredentialsException("Email");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        //User user = userRepository.findByEmail(userDetails.getUsername())
        //        .orElseThrow(() -> new IllegalArgumentException("User should exist as it was authenticated successfully"));

        return new LoginResponse(jwtService.generateToken(userDetails.getUsername()));
    }
    
}
