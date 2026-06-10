package com.example.demo.Entity;

public class WeatherSubscription {
    private Long id;
    private Long userId;
    private String city;
    private String tempThresholdType; // ABOVE, BELOW, NONE
    private Double tempThresholdVal;
    private String conditionThreshold; // Rain, Snow, Clouds, etc.
    private Boolean isActive;

    public WeatherSubscription() {
    }

    public WeatherSubscription(Long userId, String city, String tempThresholdType, Double tempThresholdVal, String conditionThreshold, Boolean isActive) {
        this.userId = userId;
        this.city = city;
        this.tempThresholdType = tempThresholdType;
        this.tempThresholdVal = tempThresholdVal;
        this.conditionThreshold = conditionThreshold;
        this.isActive = isActive;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getTempThresholdType() {
        return tempThresholdType;
    }

    public void setTempThresholdType(String tempThresholdType) {
        this.tempThresholdType = tempThresholdType;
    }

    public Double getTempThresholdVal() {
        return tempThresholdVal;
    }

    public void setTempThresholdVal(Double tempThresholdVal) {
        this.tempThresholdVal = tempThresholdVal;
    }

    public String getConditionThreshold() {
        return conditionThreshold;
    }

    public void setConditionThreshold(String conditionThreshold) {
        this.conditionThreshold = conditionThreshold;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
