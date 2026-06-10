package com.example.demo.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;

import javax.sql.DataSource;

import org.springframework.stereotype.Repository;

@Repository
public class JdbcTokenBlacklistRepository implements TokenBlacklistRepository {

    private final DataSource dataSource;

    public JdbcTokenBlacklistRepository(DataSource dataSource) {
        this.dataSource = dataSource;
        // ensure table exists
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE TABLE IF NOT EXISTS token_blacklist (token VARCHAR(512) PRIMARY KEY, expiry BIGINT)");
        } catch (SQLException ex) {
            throw new RuntimeException("Error ensuring token_blacklist table exists", ex);
        }
    }

    @Override
    public void blacklistToken(String token, long expiryEpochMs) {
        String sql = "INSERT INTO token_blacklist (token, expiry) VALUES (?, ?) ON DUPLICATE KEY UPDATE expiry = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, token);
            stmt.setLong(2, expiryEpochMs);
            stmt.setLong(3, expiryEpochMs);
            stmt.executeUpdate();
        } catch (SQLException ex) {
            throw new RuntimeException("Error blacklisting token", ex);
        }
    }

    @Override
    public boolean isBlacklisted(String token) {
        String sql = "SELECT expiry FROM token_blacklist WHERE token = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, token);
            Long expiry = null;
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    expiry = rs.getLong("expiry");
                }
            }
            if (expiry == null) {
                return false;
            }
            long now = Instant.now().toEpochMilli();
            if (expiry < now) {
                // expired blacklist entry, remove it
                try (PreparedStatement deleteStmt = conn.prepareStatement("DELETE FROM token_blacklist WHERE token = ?")) {
                    deleteStmt.setString(1, token);
                    deleteStmt.executeUpdate();
                }
                return false;
            }
            return true;
        } catch (SQLException ex) {
            return false;
        }
    }
}
