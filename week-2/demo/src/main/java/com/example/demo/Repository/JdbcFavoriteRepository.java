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
import com.example.demo.Entity.Favorite;

@Repository
public class JdbcFavoriteRepository implements FavoriteRepository {

    private final DataSource dataSource;

    public JdbcFavoriteRepository(DataSource dataSource) {
        this.dataSource = dataSource;
        // ensure table exists
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE TABLE IF NOT EXISTS user_favorites (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "user_id BIGINT NOT NULL, " +
                    "city VARCHAR(255) NOT NULL, " +
                    "UNIQUE KEY unique_user_city (user_id, city), " +
                    "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE" +
                    ")");
        } catch (SQLException ex) {
            throw new RuntimeException("Error ensuring user_favorites table exists", ex);
        }
    }

    @Override
    public List<Favorite> findByUserId(Long userId) {
        String sql = "SELECT id, user_id, city FROM user_favorites WHERE user_id = ?";
        List<Favorite> favorites = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Favorite fav = new Favorite();
                    fav.setId(rs.getLong("id"));
                    fav.setUserId(rs.getLong("user_id"));
                    fav.setCity(rs.getString("city"));
                    favorites.add(fav);
                }
            }
        } catch (SQLException ex) {
            throw new RuntimeException("Error fetching favorites", ex);
        }
        return favorites;
    }

    @Override
    public void save(Favorite favorite) {
        String sql = "INSERT IGNORE INTO user_favorites (user_id, city) VALUES (?, ?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, favorite.getUserId());
            stmt.setString(2, favorite.getCity());
            stmt.executeUpdate();
        } catch (SQLException ex) {
            throw new RuntimeException("Error saving favorite", ex);
        }
    }

    @Override
    public void delete(Long userId, String city) {
        String sql = "DELETE FROM user_favorites WHERE user_id = ? AND city = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setString(2, city);
            stmt.executeUpdate();
        } catch (SQLException ex) {
            throw new RuntimeException("Error deleting favorite", ex);
        }
    }

    @Override
    public boolean exists(Long userId, String city) {
        String sql = "SELECT 1 FROM user_favorites WHERE user_id = ? AND city = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setString(2, city);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException ex) {
            throw new RuntimeException("Error checking favorite existence", ex);
        }
    }
}
