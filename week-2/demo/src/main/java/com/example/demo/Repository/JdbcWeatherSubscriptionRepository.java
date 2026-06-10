package com.example.demo.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import javax.sql.DataSource;

import org.springframework.stereotype.Repository;
import com.example.demo.Entity.WeatherSubscription;

@Repository
public class JdbcWeatherSubscriptionRepository implements WeatherSubscriptionRepository {

    private final DataSource dataSource;

    public JdbcWeatherSubscriptionRepository(DataSource dataSource) {
        this.dataSource = dataSource;
        // ensure table exists
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE TABLE IF NOT EXISTS weather_subscriptions (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "user_id BIGINT NOT NULL, " +
                    "city VARCHAR(255) NOT NULL, " +
                    "temp_threshold_type VARCHAR(50) DEFAULT 'NONE', " +
                    "temp_threshold_val DOUBLE DEFAULT 0.0, " +
                    "condition_threshold VARCHAR(100) DEFAULT 'None', " +
                    "is_active BOOLEAN DEFAULT TRUE, " +
                    "UNIQUE KEY unique_user_sub_city (user_id, city), " +
                    "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE" +
                    ")");
        } catch (SQLException ex) {
            throw new RuntimeException("Error ensuring weather_subscriptions table exists", ex);
        }
    }

    @Override
    public List<WeatherSubscription> findByUserId(Long userId) {
        String sql = "SELECT id, user_id, city, temp_threshold_type, temp_threshold_val, condition_threshold, is_active FROM weather_subscriptions WHERE user_id = ?";
        List<WeatherSubscription> list = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        } catch (SQLException ex) {
            throw new RuntimeException("Error fetching subscriptions for user", ex);
        }
        return list;
    }

    @Override
    public List<WeatherSubscription> findAllActive() {
        String sql = "SELECT id, user_id, city, temp_threshold_type, temp_threshold_val, condition_threshold, is_active FROM weather_subscriptions WHERE is_active = TRUE";
        List<WeatherSubscription> list = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException ex) {
            throw new RuntimeException("Error fetching active subscriptions", ex);
        }
        return list;
    }

    @Override
    public Optional<WeatherSubscription> findByUserIdAndCity(Long userId, String city) {
        String sql = "SELECT id, user_id, city, temp_threshold_type, temp_threshold_val, condition_threshold, is_active FROM weather_subscriptions WHERE user_id = ? AND city = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setString(2, city);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        } catch (SQLException ex) {
            throw new RuntimeException("Error fetching subscription", ex);
        }
        return Optional.empty();
    }

    @Override
    public void save(WeatherSubscription sub) {
        String sql = "INSERT INTO weather_subscriptions (user_id, city, temp_threshold_type, temp_threshold_val, condition_threshold, is_active) " +
                "VALUES (?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE temp_threshold_type = ?, temp_threshold_val = ?, condition_threshold = ?, is_active = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, sub.getUserId());
            stmt.setString(2, sub.getCity());
            stmt.setString(3, sub.getTempThresholdType());
            stmt.setDouble(4, sub.getTempThresholdVal());
            stmt.setString(5, sub.getConditionThreshold());
            stmt.setBoolean(6, sub.getIsActive());
            
            stmt.setString(7, sub.getTempThresholdType());
            stmt.setDouble(8, sub.getTempThresholdVal());
            stmt.setString(9, sub.getConditionThreshold());
            stmt.setBoolean(10, sub.getIsActive());
            
            stmt.executeUpdate();
        } catch (SQLException ex) {
            throw new RuntimeException("Error saving subscription", ex);
        }
    }

    @Override
    public void delete(Long userId, String city) {
        String sql = "DELETE FROM weather_subscriptions WHERE user_id = ? AND city = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setString(2, city);
            stmt.executeUpdate();
        } catch (SQLException ex) {
            throw new RuntimeException("Error deleting subscription", ex);
        }
    }

    private WeatherSubscription mapRow(ResultSet rs) throws SQLException {
        WeatherSubscription sub = new WeatherSubscription();
        sub.setId(rs.getLong("id"));
        sub.setUserId(rs.getLong("user_id"));
        sub.setCity(rs.getString("city"));
        sub.setTempThresholdType(rs.getString("temp_threshold_type"));
        sub.setTempThresholdVal(rs.getDouble("temp_threshold_val"));
        sub.setConditionThreshold(rs.getString("condition_threshold"));
        sub.setIsActive(rs.getBoolean("is_active"));
        return sub;
    }
}
