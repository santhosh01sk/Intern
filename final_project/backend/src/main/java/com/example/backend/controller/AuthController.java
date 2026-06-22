package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtils;
import com.example.backend.security.UserDetailsImpl;
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

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
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
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        Role role;
        try {
            role = Role.valueOf(signUpRequest.getRole().toUpperCase());
        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Invalid role specified. Role must be STUDENT, TEACHER, or ADMIN."));
        }

        User user = User.builder()
                .email(signUpRequest.getEmail())
                .password(encoder.encode(signUpRequest.getPassword()))
                .firstName(signUpRequest.getFirstName())
                .lastName(signUpRequest.getLastName())
                .role(role)
                .build();

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
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

            String newAccessToken = jwtUtils.generateTokenFromUsername(user.getEmail());
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
