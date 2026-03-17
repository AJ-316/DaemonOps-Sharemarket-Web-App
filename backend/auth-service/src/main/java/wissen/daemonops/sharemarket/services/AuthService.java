package wissen.daemonops.sharemarket.services;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import wissen.daemonops.sharemarket.config.JwtService;
import wissen.daemonops.sharemarket.dtos.LoginRequest;
import wissen.daemonops.sharemarket.dtos.LoginResponse;
import wissen.daemonops.sharemarket.dtos.RegisterRequestDto;
import wissen.daemonops.sharemarket.models.BankDetails;
import wissen.daemonops.sharemarket.models.Nominee;
import wissen.daemonops.sharemarket.models.Role;
import wissen.daemonops.sharemarket.models.User;
import wissen.daemonops.sharemarket.models.UserDetails;
import wissen.daemonops.sharemarket.repos.BankDetailsRepository;
import wissen.daemonops.sharemarket.repos.NomineeRepository;
import wissen.daemonops.sharemarket.repos.UserDetailsRepository;
import wissen.daemonops.sharemarket.repos.UserRepo;

@Service
public class AuthService {

    private final JwtService jwtService;
    private final UserRepo userRepository;
    private final UserDetailsRepository userDetailsRepository;
    private final BankDetailsRepository bankDetailsRepository;
    private final NomineeRepository nomineeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            JwtService jwtService,
            UserRepo userRepository,
            UserDetailsRepository userDetailsRepository,
            BankDetailsRepository bankDetailsRepository,
            NomineeRepository nomineeRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.userDetailsRepository = userDetailsRepository;
        this.bankDetailsRepository = bankDetailsRepository;
        this.nomineeRepository = nomineeRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    public LoginResponse login(LoginRequest request) {
        if (!userRepository.existsByEmail(request.email())) {
            throw new BadCredentialsException("Email not found");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        org.springframework.security.core.userdetails.UserDetails userDetails = (org.springframework.security.core.userdetails.UserDetails) authentication
                .getPrincipal();

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return new LoginResponse(
                jwtService.generateToken(userDetails.getUsername()),
                user.getRole().name(), user.getUserId());
    }

    public String register(RegisterRequestDto dto) {

        // 1. Check duplicate email
        if (userRepository.existsByEmail(dto.email())) {
            throw new IllegalArgumentException("Email already registered");
        }

        // 2. Save User (auth table)
        User user = new User();
        user.setEmail(dto.email());
        user.setPassword(passwordEncoder.encode(dto.password()));
        user.setRole(Role.USER);
        userRepository.save(user);

        // 3. Save UserDetails
        UserDetails userDetails = new UserDetails();
        userDetails.setUser(user);
        userDetails.setFirstName(dto.firstName());
        userDetails.setMiddleName(dto.middleName());
        userDetails.setLastName(dto.lastName());
        userDetails.setMobile(dto.mobile());
        userDetails.setPanId(dto.pan());
        userDetails.setAadhaarId(dto.aadhaar());
        userDetails.setPanName(dto.panName());
        userDetails.setDob(dto.dob());
        userDetailsRepository.save(userDetails);

        // 4. Save BankDetails
        BankDetails bankDetails = new BankDetails();
        bankDetails.setUserDetails(userDetails);
        bankDetails.setAccountNumber(dto.accountNumber());
        bankDetails.setIfscCode(dto.ifsc());
        bankDetails.setBankName(dto.bankName());
        bankDetails.setBranch(dto.branchName());
        bankDetailsRepository.save(bankDetails);

        // 5. Save Nominee
        Nominee nominee = new Nominee();
        nominee.setUserDetails(userDetails);
        nominee.setFirstName(dto.nomineeFirstName());
        nominee.setMiddleName(dto.nomineeMiddleName());
        nominee.setLastName(dto.nomineeLastName());
        nominee.setRelationship(dto.nomineeRelationship());
        nominee.setEmail(dto.nomineeEmail());
        nominee.setPanId(dto.nomineePan());
        nominee.setDob(dto.nomineeDob());
        nomineeRepository.save(nominee);

        return "User registered successfully";
    }
}