package com.example.demo.Controller;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.demo.Repository.TokenBlacklistRepository;
import com.example.demo.Security.JwtUtil;
import com.example.demo.Service.UserService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final TokenBlacklistRepository tokenBlacklistRepository;

    public AuthController(UserService userService, JwtUtil jwtUtil, TokenBlacklistRepository tokenBlacklistRepository) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.tokenBlacklistRepository = tokenBlacklistRepository;
    }
    @GetMapping("/check")
    public ResponseEntity<List<String>> getRegisteredUsers() {
        return ResponseEntity.ok(userService.getRegisteredUsers());
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> signup(@RequestBody Map<String, String> payload) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(userService.signup(payload.get("username"), payload.get("password")));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", exception.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> payload) {
        try {
            String username = payload.get("username");
            String password = payload.get("password");

            if (userService.login(username, password)) {
                String normalized = username.trim();
                String token = jwtUtil.generateToken(normalized);
                return ResponseEntity.ok(Map.of(
                        "message", "Login successful.",
                        "username", normalized,
                        "token", token
                ));
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid username or password."));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@org.springframework.web.bind.annotation.RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Authorization header missing or invalid."));
        }
        String token = authHeader.substring(7);
        try {
            long expiry = jwtUtil.getExpirationEpochMs(token);
            tokenBlacklistRepository.blacklistToken(token, expiry);
            SecurityContextHolder.clearContext();
            return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid token."));
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<Map<String, String>> validate(@org.springframework.web.bind.annotation.RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Missing token."));
        }
        String token = authHeader.substring(7);
        try {
            if (tokenBlacklistRepository.isBlacklisted(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Token invalid."));
            }
            String username = jwtUtil.getUsernameFromToken(token);
            return ResponseEntity.ok(Map.of("username", username));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Token invalid or expired."));
        }
    }
}