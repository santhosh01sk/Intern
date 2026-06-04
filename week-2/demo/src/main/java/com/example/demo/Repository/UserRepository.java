package com.example.demo.Repository;

import java.util.List;
import java.util.Optional;

import com.example.demo.Entity.User;

public interface UserRepository {
    Optional<User> findByUsername(String username);
    void save(User user);
    List<User> findAll();
}
