package com.example.demo.Repository;

public interface TokenBlacklistRepository {
    void blacklistToken(String token, long expiryEpochMs);
    boolean isBlacklisted(String token);
}
