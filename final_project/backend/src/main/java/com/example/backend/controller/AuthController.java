package com.example.backend.controller;

import com.example.backend.dto.*;
import java.util.Optional;
import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtils;
import com.example.backend.security.UserDetailsImpl;
import com.example.backend.service.EmailService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    EmailService emailService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());
        if (userOpt.isPresent() && !userOpt.get().isEmailVerified()) {
            User user = userOpt.get();
            String newOtp = String.format("%06d", new java.util.Random().nextInt(1000000));
            user.setOtp(newOtp);
            userRepository.save(user);

            emailService.sendOtpEmail(user.getEmail(), user.getFirstName(), newOtp);

            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is not verified. A new OTP has been sent to your email. Please verify your email first."));
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        String jwt = jwtUtils.generateJwtToken(userDetails);

        String refreshToken = jwtUtils.generateRefreshTokenFromUsername(userDetails.getUsername());
        ResponseCookie refreshCookie = jwtUtils.generateRefreshCookie(refreshToken);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(new LoginResponse(
                        jwt,
                        userDetails.getUsername(),
                        userDetails.getFirstName(),
                        userDetails.getLastName(),
                        userDetails.getAuthorities().iterator().next().getAuthority().substring(5) // Remove ROLE_ prefix
                ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest signUpRequest) {
        String email = signUpRequest.getEmail();
        if (email == null || !email.matches("^[A-Za-z0-9._%+-]+@(gmail\\.com|outlook\\.com|yahoo\\.com|hotmail\\.com|icloud\\.com)$")) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email must be a valid domain (e.g. @gmail.com, @outlook.com, @yahoo.com, @hotmail.com, @icloud.com)"));
        }

        Optional<User> existingUserOpt = userRepository.findByEmail(email);
        User user;
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            if (existingUser.isEmailVerified()) {
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Error: Email is already in use!"));
            }

            // Unverified user is re-registering: overwrite details
            user = existingUser;
            user.setPassword(encoder.encode(signUpRequest.getPassword()));
            user.setFirstName(signUpRequest.getFirstName());
            user.setLastName(signUpRequest.getLastName());
            try {
                user.setRole(Role.valueOf(signUpRequest.getRole().toUpperCase()));
            } catch (Exception e) {
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Error: Invalid role specified. Role must be STUDENT, TEACHER, or ADMIN."));
            }
        } else {
            Role role;
            try {
                role = Role.valueOf(signUpRequest.getRole().toUpperCase());
            } catch (Exception e) {
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Error: Invalid role specified. Role must be STUDENT, TEACHER, or ADMIN."));
            }

            user = User.builder()
                    .email(email)
                    .password(encoder.encode(signUpRequest.getPassword()))
                    .firstName(signUpRequest.getFirstName())
                    .lastName(signUpRequest.getLastName())
                    .role(role)
                    .build();
        }

        // Generate 6-digit random OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
        user.setOtp(otp);
        user.setEmailVerified(false);
        userRepository.save(user);

        emailService.sendOtpEmail(user.getEmail(), user.getFirstName(), otp);

        return ResponseEntity.ok(new MessageResponse("User registered successfully! An OTP has been sent to your email."));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerificationRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (!userOpt.isPresent()) {
            return ResponseEntity
                    .status(404)
                    .body(new MessageResponse("Error: User not found!"));
        }

        User user = userOpt.get();
        if (user.isEmailVerified()) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already verified!"));
        }

        if (user.getOtp() == null || !user.getOtp().equals(request.getOtp())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Invalid OTP code. Please check and try again."));
        }

        user.setEmailVerified(true);
        user.setOtp(null);
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Email verified successfully! You can now log in."));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody ResendOtpRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (!userOpt.isPresent()) {
            return ResponseEntity
                    .status(404)
                    .body(new MessageResponse("Error: User not found!"));
        }

        User user = userOpt.get();
        if (user.isEmailVerified()) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already verified!"));
        }

        String newOtp = String.format("%06d", new java.util.Random().nextInt(1000000));
        user.setOtp(newOtp);
        userRepository.save(user);

        emailService.sendOtpEmail(user.getEmail(), user.getFirstName(), newOtp);

        return ResponseEntity.ok(new MessageResponse("OTP verification code resent successfully!"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {
        String refreshTokenVal = jwtUtils.getRefreshTokenFromCookies(request);

        if (refreshTokenVal == null || refreshTokenVal.isEmpty()) {
            return ResponseEntity.status(401).body(new MessageResponse("Refresh Token Cookie is missing!"));
        }

        if (!jwtUtils.validateJwtToken(refreshTokenVal)) {
            return ResponseEntity.status(401).body(new MessageResponse("Refresh token is invalid or expired!"));
        }

        try {
            String email = jwtUtils.getUserNameFromJwtToken(refreshTokenVal);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found!"));

            String newAccessToken = jwtUtils.generateTokenFromUsername(user.getEmail(), user.getRole().name());
            String newRefreshToken = jwtUtils.generateRefreshTokenFromUsername(user.getEmail());
            ResponseCookie refreshCookie = jwtUtils.generateRefreshCookie(newRefreshToken);

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(new TokenRefreshResponse(
                        newAccessToken,
                        user.getEmail(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getRole().name()
                    ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(HttpServletRequest request) {

        ResponseCookie cleanCookie = jwtUtils.getCleanRefreshCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cleanCookie.toString())
                .body(new MessageResponse("Log out successful!"));
    }
}
