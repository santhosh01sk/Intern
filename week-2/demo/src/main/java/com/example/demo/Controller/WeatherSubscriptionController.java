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

import com.example.demo.Entity.User;
import com.example.demo.Entity.WeatherSubscription;
import com.example.demo.Repository.UserRepository;
import com.example.demo.Repository.WeatherSubscriptionRepository;

@RestController
@RequestMapping("/api/subscriptions")
@CrossOrigin(origins = "http://localhost:3000")
public class WeatherSubscriptionController {

    private final WeatherSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    public WeatherSubscriptionController(WeatherSubscriptionRepository subscriptionRepository, UserRepository userRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getSubscriptions(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<WeatherSubscription> subs = subscriptionRepository.findByUserId(user.getId());
        return ResponseEntity.ok(subs);
    }

    @PostMapping
    public ResponseEntity<?> createOrUpdateSubscription(Principal principal, @RequestBody Map<String, Object> payload) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }

        String city = (String) payload.get("city");
        if (city == null || city.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "City name is required"));
        }

        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String tempType = (String) payload.getOrDefault("tempThresholdType", "NONE");
        double tempVal = 0.0;
        if (payload.get("tempThresholdVal") != null) {
            tempVal = ((Number) payload.get("tempThresholdVal")).doubleValue();
        }
        String condition = (String) payload.getOrDefault("conditionThreshold", "None");
        boolean active = (Boolean) payload.getOrDefault("isActive", true);

        WeatherSubscription sub = subscriptionRepository.findByUserIdAndCity(user.getId(), city.trim())
                .orElse(new WeatherSubscription());

        sub.setUserId(user.getId());
        sub.setCity(city.trim());
        sub.setTempThresholdType(tempType);
        sub.setTempThresholdVal(tempVal);
        sub.setConditionThreshold(condition);
        sub.setIsActive(active);

        subscriptionRepository.save(sub);
        return ResponseEntity.ok(sub);
    }

    @DeleteMapping
    public ResponseEntity<?> deleteSubscription(Principal principal, @RequestParam String city) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        if (city == null || city.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "City name is required"));
        }

        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        subscriptionRepository.delete(user.getId(), city.trim());
        return ResponseEntity.ok(Map.of("message", "Subscription removed successfully"));
    }
}
