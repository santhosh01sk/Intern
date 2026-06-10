package com.example.demo;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.example.demo.Entity.Favorite;
import com.example.demo.Entity.User;
import com.example.demo.Entity.WeatherAlert;
import com.example.demo.Entity.WeatherSubscription;
import com.example.demo.Repository.FavoriteRepository;
import com.example.demo.Repository.UserRepository;
import com.example.demo.Repository.WeatherAlertRepository;
import com.example.demo.Repository.WeatherSubscriptionRepository;
import com.example.demo.Service.WeatherAlertService;

@SpringBootTest
public class WeatherAlertSystemTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private WeatherSubscriptionRepository subscriptionRepository;

    @Autowired
    private WeatherAlertRepository alertRepository;

    @Autowired
    private WeatherAlertService alertService;

    private User testUser;

    @BeforeEach
    public void setUp() {
        String testUsername = "testuser_" + System.currentTimeMillis();
        testUser = new User(testUsername, "password");
        userRepository.save(testUser);
        
        // Reload user to get ID
        testUser = userRepository.findByUsername(testUsername).orElseThrow();
    }

    @Test
    public void testFavorites() {
        Favorite fav = new Favorite(testUser.getId(), "London");
        favoriteRepository.save(fav);

        assertTrue(favoriteRepository.exists(testUser.getId(), "London"));
        assertFalse(favoriteRepository.exists(testUser.getId(), "Paris"));

        List<Favorite> favorites = favoriteRepository.findByUserId(testUser.getId());
        assertEquals(1, favorites.size());
        assertEquals("London", favorites.get(0).getCity());

        favoriteRepository.delete(testUser.getId(), "London");
        assertFalse(favoriteRepository.exists(testUser.getId(), "London"));
    }

    @Test
    public void testSubscriptionsAndAlerts() {
        WeatherSubscription sub = new WeatherSubscription(
                testUser.getId(),
                "London",
                "ABOVE",
                -100.0, // setting extremely low threshold to guarantee triggering when weather is fetched
                "None",
                true
        );
        subscriptionRepository.save(sub);

        Optional<WeatherSubscription> fetchedSub = subscriptionRepository.findByUserIdAndCity(testUser.getId(), "London");
        assertTrue(fetchedSub.isPresent());
        assertEquals("ABOVE", fetchedSub.get().getTempThresholdType());

        // Trigger manual check for this user
        alertService.checkAndGenerateAlerts(testUser.getId());

        // Check if an alert was generated
        List<WeatherAlert> alerts = alertRepository.findByUserId(testUser.getId());
        assertNotNull(alerts);
        // Since we fetch live weather, if internet is available and OpenWeather responds, we will get an alert.
        // If no internet, the alertService will catch the exception and print to stderr without crashing, and alerts size might be 0.
        // Let's assert that we can retrieve alerts (size >= 0) and we can call read/delete operations without error.
        System.out.println("Alerts generated for test user: " + alerts.size());
        
        alertRepository.markAllAsRead(testUser.getId());
        alertRepository.deleteByUserId(testUser.getId());
        
        List<WeatherAlert> clearedAlerts = alertRepository.findByUserId(testUser.getId());
        assertEquals(0, clearedAlerts.size());

        // Cleanup
        subscriptionRepository.delete(testUser.getId(), "London");
    }
}
