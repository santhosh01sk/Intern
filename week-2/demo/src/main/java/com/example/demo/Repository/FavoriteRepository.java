package com.example.demo.Repository;

import java.util.List;
import com.example.demo.Entity.Favorite;

public interface FavoriteRepository {
    List<Favorite> findByUserId(Long userId);
    void save(Favorite favorite);
    void delete(Long userId, String city);
    boolean exists(Long userId, String city);
}
