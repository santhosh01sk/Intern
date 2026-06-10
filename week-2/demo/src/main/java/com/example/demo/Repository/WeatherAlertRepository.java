package com.example.demo.Repository;

import java.util.List;
import com.example.demo.Entity.WeatherAlert;

public interface WeatherAlertRepository {
    List<WeatherAlert> findByUserId(Long userId);
    void save(WeatherAlert alert);
    void markAllAsRead(Long userId);
    void deleteByUserId(Long userId);
}
