package com.example.demo.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.example.demo.Entity.WeatherAlert;
import com.example.demo.Entity.WeatherSubscription;
import com.example.demo.Repository.WeatherAlertRepository;
import com.example.demo.Repository.WeatherSubscriptionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class WeatherAlertService {

    private final WeatherSubscriptionRepository subscriptionRepository;
    private final WeatherAlertRepository alertRepository;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${weather.api.key}")
    private String apiKey;

    public WeatherAlertService(WeatherSubscriptionRepository subscriptionRepository, WeatherAlertRepository alertRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.alertRepository = alertRepository;
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();
    }

    // Run every 30 minutes (1800000 milliseconds)
    @Scheduled(fixedRate = 1800000)
    public void scheduleCheckAllAlerts() {
        checkAndGenerateAlerts(null);
    }

    public void checkAndGenerateAlerts(Long specificUserId) {
        List<WeatherSubscription> subscriptions;
        if (specificUserId != null) {
            // Check only subscriptions for a specific user (e.g. manual trigger)
            subscriptions = subscriptionRepository.findByUserId(specificUserId);
        } else {
            // Check all active subscriptions
            subscriptions = subscriptionRepository.findAllActive();
        }

        for (WeatherSubscription sub : subscriptions) {
            if (!sub.getIsActive()) {
                continue;
            }
            try {
                WeatherData data = fetchWeatherForCity(sub.getCity());
                if (data == null) {
                    continue;
                }

                boolean shouldTrigger = false;
                StringBuilder messageBuilder = new StringBuilder();

                // 1. Check Temperature Thresholds
                String thresholdType = sub.getTempThresholdType();
                Double thresholdVal = sub.getTempThresholdVal();
                if (thresholdType != null && !thresholdType.equalsIgnoreCase("NONE") && thresholdVal != null) {
                    if (thresholdType.equalsIgnoreCase("ABOVE") && data.temp > thresholdVal) {
                        shouldTrigger = true;
                        messageBuilder.append(String.format("Temperature in %s is %.1f°C, exceeding your threshold of %.1f°C. ",
                                sub.getCity(), data.temp, thresholdVal));
                    } else if (thresholdType.equalsIgnoreCase("BELOW") && data.temp < thresholdVal) {
                        shouldTrigger = true;
                        messageBuilder.append(String.format("Temperature in %s is %.1f°C, which is below your threshold of %.1f°C. ",
                                sub.getCity(), data.temp, thresholdVal));
                    }
                }

                // 2. Check Weather Condition Thresholds
                String condThreshold = sub.getConditionThreshold();
                if (condThreshold != null && !condThreshold.equalsIgnoreCase("None") && !condThreshold.trim().isEmpty()) {
                    if (data.condition.equalsIgnoreCase(condThreshold.trim()) ||
                            data.description.toLowerCase().contains(condThreshold.toLowerCase().trim())) {
                        shouldTrigger = true;
                        messageBuilder.append(String.format("Weather condition in %s is '%s' (%s), matching your alert rule. ",
                                sub.getCity(), data.condition, data.description));
                    }
                }

                if (shouldTrigger) {
                    WeatherAlert alert = new WeatherAlert();
                    alert.setUserId(sub.getUserId());
                    alert.setCity(sub.getCity());
                    alert.setMessage(messageBuilder.toString().trim());
                    alert.setCreatedAt(System.currentTimeMillis());
                    alert.setIsRead(false);
                    alertRepository.save(alert);
                }
            } catch (Exception ex) {
                // Keep checking other subscriptions if one fails
                System.err.println("Error evaluating subscription for city: " + sub.getCity() + ", Error: " + ex.getMessage());
            }
        }
    }

    private WeatherData fetchWeatherForCity(String city) throws Exception {
        String encodedCity = URLEncoder.encode(city, StandardCharsets.UTF_8);
        String url = String.format("https://api.openweathermap.org/data/2.5/weather?q=%s&units=metric&appid=%s", encodedCity, apiKey);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            System.err.println("Failed to fetch weather for " + city + ". Status: " + response.statusCode());
            return null;
        }

        JsonNode root = objectMapper.readTree(response.body());
        double temp = root.path("main").path("temp").asDouble();
        
        String condition = "Unknown";
        String description = "No description";
        JsonNode weatherNode = root.path("weather");
        if (weatherNode.isArray() && weatherNode.size() > 0) {
            condition = weatherNode.get(0).path("main").asText();
            description = weatherNode.get(0).path("description").asText();
        }

        return new WeatherData(temp, condition, description);
    }

    private static class WeatherData {
        final double temp;
        final String condition;
        final String description;

        WeatherData(double temp, String condition, String description) {
            this.temp = temp;
            this.condition = condition;
            this.description = description;
        }
    }
}
