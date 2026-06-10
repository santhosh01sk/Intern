package com.example.demo.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.stereotype.Repository;
import com.example.demo.Entity.WeatherAlert;

@Repository
public class JdbcWeatherAlertRepository implements WeatherAlertRepository {

    private final DataSource dataSource;

    public JdbcWeatherAlertRepository(DataSource dataSource) {
        this.dataSource = dataSource;
        // ensure table exists
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE TABLE IF NOT EXISTS weather_alerts (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "user_id BIGINT NOT NULL, " +
                    "city VARCHAR(255) NOT NULL, " +
                    "message VARCHAR(512) NOT NULL, " +
                    "created_at BIGINT NOT NULL, " +
                    "is_read BOOLEAN DEFAULT FALSE, " +
                    "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE" +
                    ")");
        } catch (SQLException ex) {
            throw new RuntimeException("Error ensuring weather_alerts table exists", ex);
        }
    }

    @Override
    public List<WeatherAlert> findByUserId(Long userId) {
        String sql = "SELECT id, user_id, city, message, created_at, is_read FROM weather_alerts WHERE user_id = ? ORDER BY created_at DESC";
        List<WeatherAlert> alerts = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    WeatherAlert alert = new WeatherAlert();
                    alert.setId(rs.getLong("id"));
                    alert.setUserId(rs.getLong("user_id"));
                    alert.setCity(rs.getString("city"));
                    alert.setMessage(rs.getString("message"));
                    alert.setCreatedAt(rs.getLong("created_at"));
                    alert.setIsRead(rs.getBoolean("is_read"));
                    alerts.add(alert);
                }
            }
        } catch (SQLException ex) {
            throw new RuntimeException("Error fetching alerts", ex);
        }
        return alerts;
    }

    @Override
    public void save(WeatherAlert alert) {
        String sql = "INSERT INTO weather_alerts (user_id, city, message, created_at, is_read) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, alert.getUserId());
            stmt.setString(2, alert.getCity());
            stmt.setString(3, alert.getMessage());
            stmt.setLong(4, alert.getCreatedAt());
            stmt.setBoolean(5, alert.getIsRead());
            stmt.executeUpdate();
        } catch (SQLException ex) {
            throw new RuntimeException("Error saving alert", ex);
        }
    }

    @Override
    public void markAllAsRead(Long userId) {
        String sql = "UPDATE weather_alerts SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.executeUpdate();
        } catch (SQLException ex) {
            throw new RuntimeException("Error marking alerts as read", ex);
        }
    }

    @Override
    public void deleteByUserId(Long userId) {
        String sql = "DELETE FROM weather_alerts WHERE user_id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.executeUpdate();
        } catch (SQLException ex) {
            throw new RuntimeException("Error deleting alerts", ex);
        }
    }
}
