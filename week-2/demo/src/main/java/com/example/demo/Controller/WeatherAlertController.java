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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.Entity.User;
import com.example.demo.Entity.WeatherAlert;
import com.example.demo.Repository.UserRepository;
import com.example.demo.Repository.WeatherAlertRepository;
import com.example.demo.Service.WeatherAlertService;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "http://localhost:3000")
public class WeatherAlertController {

    private final WeatherAlertRepository alertRepository;
    private final UserRepository userRepository;
    private final WeatherAlertService alertService;

    public WeatherAlertController(WeatherAlertRepository alertRepository, UserRepository userRepository, WeatherAlertService alertService) {
        this.alertRepository = alertRepository;
        this.userRepository = userRepository;
        this.alertService = alertService;
    }

    @GetMapping
    public ResponseEntity<?> getAlerts(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<WeatherAlert> alerts = alertRepository.findByUserId(user.getId());
        return ResponseEntity.ok(alerts);
    }

    @PostMapping("/read")
    public ResponseEntity<?> markAsRead(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        alertRepository.markAllAsRead(user.getId());
        return ResponseEntity.ok(Map.of("message", "All alerts marked as read"));
    }

    @PostMapping("/check")
    public ResponseEntity<?> triggerCheck(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        try {
            alertService.checkAndGenerateAlerts(user.getId());
            return ResponseEntity.ok(Map.of("message", "Weather alerts check completed."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to check weather alerts: " + e.getMessage()));
        }
    }

    @DeleteMapping
    public ResponseEntity<?> clearAlerts(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        alertRepository.deleteByUserId(user.getId());
        return ResponseEntity.ok(Map.of("message", "All alerts cleared"));
    }
}
