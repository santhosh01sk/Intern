package com.example.demo.Repository;

import java.time.Instant;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcTokenBlacklistRepository implements TokenBlacklistRepository {

    private final JdbcTemplate jdbc;

    public JdbcTokenBlacklistRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        // ensure table exists
        jdbc.execute("CREATE TABLE IF NOT EXISTS token_blacklist (token VARCHAR(512) PRIMARY KEY, expiry BIGINT)");
    }

    @Override
    public void blacklistToken(String token, long expiryEpochMs) {
        String sql = "INSERT INTO token_blacklist (token, expiry) VALUES (?, ?) ON DUPLICATE KEY UPDATE expiry = ?";
        jdbc.update(sql, token, expiryEpochMs, expiryEpochMs);
    }

    @Override
    public boolean isBlacklisted(String token) {
        String sql = "SELECT expiry FROM token_blacklist WHERE token = ?";
        try {
            Long expiry = jdbc.query(sql, rs -> {
                if (rs.next()) return rs.getLong("expiry");
                return null;
            }, token);
            if (expiry == null) return false;
            long now = Instant.now().toEpochMilli();
            if (expiry < now) {
                // expired blacklist entry, remove it
                jdbc.update("DELETE FROM token_blacklist WHERE token = ?", token);
                return false;
            }
            return true;
        } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
            return false;
        }
    }
}
