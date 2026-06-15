package com.example.demo.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.Entity.User;
import com.example.demo.Repository.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    public Map<String, String> signup(String username, String password,String email) {
        String normalizedUsername = normalize(username);
        String normalizedPassword = normalize(password);
        String normalizedEmail = normalize(email);
        if (userRepository.findByUsername(normalizedUsername).isPresent()) {
            throw new IllegalStateException("Username already exists.");
        }
        if (((Optional<User>) userRepository.findByEmail(normalizedEmail)).isPresent()) {
            throw new IllegalStateException("Email already exists.");
        }
        String hashedPassword = passwordEncoder.encode(normalizedPassword);
        User user = new User(normalizedUsername, hashedPassword, normalizedEmail);
        userRepository.save(user);
        return Map.of(
                "message", "User registered successfully.",
                "username", normalizedUsername
        );
    }
    public Optional<User> loginByEmail(String email, String password) {
        String normalizedEmail = normalize(email);
        String normalizedPassword = normalize(password);

        return userRepository.findByEmail(normalizedEmail)
                .filter(user -> {
                    String dbPassword = user.getPassword();
                    try {
                        if (passwordEncoder.matches(normalizedPassword, dbPassword)) {
                            return true;
                        }
                    } catch (Exception e) {
                        // ignore and fall back to plain text check
                    }
                    if (dbPassword.equals(normalizedPassword)) {
                        // Upgrade to hashed password
                        user.setPassword(passwordEncoder.encode(normalizedPassword));
                        userRepository.save(user);
                        return true;
                    }
                    return false;
                });
    }

    public List<String> getRegisteredUsers() {
        return userRepository.findAll().stream()
                .map(User::getUsername)
                .collect(Collectors.toList());
    }

    private String normalize(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Value is required.");
        }

        String normalized = value.trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Value is required.");
        }

        return normalized;
    }
}