package wissen.daemonops.sharemarket.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import wissen.daemonops.sharemarket.dtos.LoginRequest;
import wissen.daemonops.sharemarket.dtos.LoginResponse;
import wissen.daemonops.sharemarket.models.User;
import wissen.daemonops.sharemarket.models.UserDetails;
import wissen.daemonops.sharemarket.repos.UserDetailsRepository;
import wissen.daemonops.sharemarket.repos.UserRepo;

@Service
public class AuthService {

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private UserDetailsRepository userDetailsRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;


    public LoginResponse login(LoginRequest request) {

        User user = null;

        String input = request.getUsername();

        if (input.matches("^[0-9]{10}$")) {
            UserDetails userDetails = userDetailsRepository.findByMobile(input)
                    .orElseThrow(() -> new RuntimeException("User not found with mobile"));

            user = userDetails.getUser();

        } else {
            user = userRepository.findByEmail(input)
                    .orElseThrow(() -> new RuntimeException("User not found with email"));
        }

        if (!passwordEncoder.matches(request.getPassword(),user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        return new LoginResponse("Login successful", user.getRole().name());
    }
    
}
