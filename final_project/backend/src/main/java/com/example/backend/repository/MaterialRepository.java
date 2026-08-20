package com.example.backend.repository;

import com.example.backend.model.Material;
import com.example.backend.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {
    List<Material> findByCourseOrderByUploadedAtDesc(Course course);
}
