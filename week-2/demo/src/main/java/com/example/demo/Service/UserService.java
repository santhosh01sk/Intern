package com.example.demo.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.demo.Entity.User;
import com.example.demo.Repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    public Map<String, String> signup(String username, String password) {
        String normalizedUsername = normalize(username);
        String normalizedPassword = normalize(password);

        if (userRepository.findByUsername(normalizedUsername).isPresent()) {
            throw new IllegalStateException("Username already exists.");
        }

        User user = new User(normalizedUsername, normalizedPassword);
        userRepository.save(user);

        return Map.of(
                "message", "User registered successfully.",
                "username", normalizedUsername
        );
    }

    public boolean login(String username, String password) {
        String normalizedUsername = normalize(username);
        String normalizedPassword = normalize(password);

        return userRepository.findByUsername(normalizedUsername)
                .map(user -> user.getPassword().equals(normalizedPassword))
                .orElse(false);
    }

    public List<String> getRegisteredUsers() {
        return userRepository.findAll().stream()
                .map(User::getUsername)
                .collect(Collectors.toList());
    }

    private String normalize(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Username and password are required.");
        }

        String normalized = value.trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Username and password are required.");
        }

        return normalized;
    }
}