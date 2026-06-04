package com.example.demo.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import com.example.demo.Entity.User;

@Repository
public class JdbcUserRepository implements UserRepository {

    private final JdbcTemplate jdbc;

    public JdbcUserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<User> findByUsername(String username) {
        String sql = "SELECT id, username, password FROM users WHERE username = ?";
        try {
            var users = jdbc.query(sql, new UserRowMapper(), username);
            return users.stream().findFirst();
        } catch (EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }

    @Override
    public void save(User user) {
        String sql = "INSERT INTO users (username, password) VALUES (?, ?)";
        jdbc.update(sql, user.getUsername(), user.getPassword());
    }

    @Override
    public List<User> findAll() {
        String sql = "SELECT id, username, password FROM users";
        return jdbc.query(sql, new UserRowMapper());
    }

    private static class UserRowMapper implements RowMapper<User> {
        @Override
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {
            User u = new User();
            u.setId(rs.getLong("id"));
            u.setUsername(rs.getString("username"));
            u.setPassword(rs.getString("password"));
            return u;
        }
    }
}
