package com.example.backend.repository;

import com.example.backend.model.Course;
import com.example.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByTeacher(User teacher);

    @Query("SELECT c FROM Course c WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.category) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.teacher.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.teacher.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(CONCAT(c.teacher.firstName, ' ', c.teacher.lastName)) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:category IS NULL OR :category = '' OR LOWER(c.category) = LOWER(:category))")
    Page<Course> findAllFiltered(@Param("search") String search, @Param("category") String category, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.teacher = :teacher AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.category) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:category IS NULL OR :category = '' OR LOWER(c.category) = LOWER(:category))")
    Page<Course> findAllFilteredByTeacher(
            @Param("teacher") User teacher,
            @Param("search") String search,
            @Param("category") String category,
            Pageable pageable);

    @Query("SELECT DISTINCT c.category FROM Course c WHERE c.teacher = :teacher AND c.category IS NOT NULL AND c.category <> '' ORDER BY c.category ASC")
    List<String> findDistinctCategoriesByTeacher(@Param("teacher") User teacher);
}
