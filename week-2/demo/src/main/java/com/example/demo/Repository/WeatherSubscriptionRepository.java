package com.example.demo.Repository;

import java.util.List;
import java.util.Optional;
import com.example.demo.Entity.WeatherSubscription;

public interface WeatherSubscriptionRepository {
    List<WeatherSubscription> findByUserId(Long userId);
    List<WeatherSubscription> findAllActive();
    Optional<WeatherSubscription> findByUserIdAndCity(Long userId, String city);
    void save(WeatherSubscription subscription);
    void delete(Long userId, String city);
}
