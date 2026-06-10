package com.example.demo.Controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.Entity.Favorite;
import com.example.demo.Entity.User;
import com.example.demo.Repository.FavoriteRepository;
import com.example.demo.Repository.UserRepository;

@RestController
@RequestMapping("/api/favorites")
@CrossOrigin(origins = "http://localhost:3000")
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;

    public FavoriteController(FavoriteRepository favoriteRepository, UserRepository userRepository) {
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getFavorites(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Favorite> favorites = favoriteRepository.findByUserId(user.getId());
        return ResponseEntity.ok(favorites);
    }

    @PostMapping
    public ResponseEntity<?> addFavorite(Principal principal, @RequestBody Map<String, String> payload) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        String city = payload.get("city");
        if (city == null || city.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "City name is required"));
        }

        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String cleanCity = city.trim();
        if (favoriteRepository.exists(user.getId(), cleanCity)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "City already in favorites"));
        }

        Favorite favorite = new Favorite(user.getId(), cleanCity);
        favoriteRepository.save(favorite);
        return ResponseEntity.status(HttpStatus.CREATED).body(favorite);
    }

    @DeleteMapping
    public ResponseEntity<?> removeFavorite(Principal principal, @RequestParam String city) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        if (city == null || city.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "City name is required"));
        }

        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        favoriteRepository.delete(user.getId(), city.trim());
        return ResponseEntity.ok(Map.of("message", "Favorite removed successfully"));
    }
}
