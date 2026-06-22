package com.example.backend.repository;

import com.example.backend.model.Enrollment;
import com.example.backend.model.Course;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudent(User student);
    List<Enrollment> findByCourse(Course course);
    long countByCourse(Course course);
    Optional<Enrollment> findByStudentAndCourse(User student, Course course);
}