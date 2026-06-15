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

import com.example.demo.Entity.User;

@Repository
public class JdbcUserRepository implements UserRepository {

    private final DataSource dataSource;

    public JdbcUserRepository(DataSource dataSource) {
        this.dataSource = dataSource;
        // ensure users table exists and has correct columns and unique constraints
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            
            stmt.execute("CREATE TABLE IF NOT EXISTS users (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "username VARCHAR(255) NOT NULL, " +
                    "password VARCHAR(255) NOT NULL, " +
                    "email VARCHAR(255) NOT NULL" +
                    ")");

            // Ensure username is UNIQUE
            try {
                stmt.execute("ALTER TABLE users ADD UNIQUE KEY unique_username (username)");
            } catch (SQLException ex) {
                
            }

            // Check if email column exists by trying to select it
            boolean hasEmailColumn = false;
            try (Statement testStmt = conn.createStatement()) {
                testStmt.executeQuery("SELECT email FROM users LIMIT 1");
                hasEmailColumn = true;
            } catch (SQLException e) {
                hasEmailColumn = false;
            }

            if (!hasEmailColumn) {
                try {
                    stmt.execute("ALTER TABLE users ADD COLUMN email VARCHAR(255)");
                    stmt.execute("UPDATE users SET email = CONCAT(username, '@example.com') WHERE email IS NULL OR email = ''");
                    stmt.execute("ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NOT NULL");
                } catch (SQLException ex) {
                    throw new RuntimeException("Failed to add email column to users table", ex);
                }
            }
            
            // Ensure email is UNIQUE
            try {
                stmt.execute("ALTER TABLE users ADD UNIQUE KEY unique_email (email)");
            } catch (SQLException ex) {
                // ignore if constraint exists
            }
        } catch (SQLException ex) {
            throw new RuntimeException("Error ensuring users table exists with constraints", ex);
        }
    }

    @Override
    public Optional<User> findByUsername(String username) {
        String sql = "SELECT id, username, password, email FROM users WHERE username = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, username);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    User u = new User();
                    u.setId(rs.getLong("id"));
                    u.setUsername(rs.getString("username"));
                    u.setPassword(rs.getString("password"));
                    u.setEmail(rs.getString("email"));
                    return Optional.of(u);
                }
            }
        } catch (SQLException ex) {
            throw new RuntimeException("Error executing SQL query findByUsername", ex);
        }
        return Optional.empty();
    }
    @Override
    public Optional<User> findByEmail(String email) {
        String sql = "SELECT id, username, password, email FROM users WHERE email = ?";
        try (Connection conn = dataSource.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    User u = new User();
                    u.setId(rs.getLong("id"));
                    u.setUsername(rs.getString("username"));
                    u.setPassword(rs.getString("password"));
                    u.setEmail(rs.getString("email"));
                    return Optional.of(u);
                }
            }
        } catch (SQLException ex) {
            throw new RuntimeException("Error executing SQL query findByEmail", ex);
        }
        return Optional.empty();
    }
    @Override
    public void save(User user) {
        String sql = "INSERT INTO users (username, password, email) VALUES (?, ?, ?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, user.getUsername());
            stmt.setString(2, user.getPassword());
            stmt.setString(3, user.getEmail());
            stmt.executeUpdate();
        } catch (SQLException ex) {
            throw new RuntimeException("Error executing SQL update save", ex);
        }
    }

    @Override
    public List<User> findAll() {
        String sql = "SELECT id, username, password, email FROM users";
        List<User> users = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                User u = new User();
                u.setId(rs.getLong("id"));
                u.setUsername(rs.getString("username"));
                u.setPassword(rs.getString("password"));
                u.setEmail(rs.getString("email"));
                users.add(u);
            }
        } catch (SQLException ex) {
            throw new RuntimeException("Error executing SQL query findAll", ex);
        }
        return users;
    }
}
