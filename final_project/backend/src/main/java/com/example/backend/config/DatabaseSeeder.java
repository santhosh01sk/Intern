package com.example.backend.config;

import com.example.backend.model.*;
import com.example.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;

@Component
public class DatabaseSeeder implements CommandLineRunner {
    @Autowired
    UserRepository userRepository;

    @Autowired
    CourseRepository courseRepository;

    @Autowired
    EnrollmentRepository enrollmentRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            // Seed Users
            User admin = User.builder()
                    .email("admin@example.com")
                    .password(passwordEncoder.encode("password"))
                    .firstName("Alice")
                    .lastName("Admin")
                    .role(Role.ADMIN)
                    .build();

            User teacher = User.builder()
                    .email("teacher@example.com")
                    .password(passwordEncoder.encode("password"))
                    .firstName("Bob")
                    .lastName("Teacher")
                    .role(Role.TEACHER)
                    .specialization("Computer Science")
                    .build();

            User student1 = User.builder()
                    .email("student@example.com")
                    .password(passwordEncoder.encode("password"))
                    .firstName("Charlie")
                    .lastName("Student")
                    .role(Role.STUDENT)
                    .build();

            User student2 = User.builder()
                    .email("student2@example.com")
                    .password(passwordEncoder.encode("password"))
                    .firstName("David")
                    .lastName("Learner")
                    .role(Role.STUDENT)
                    .build();

            userRepository.saveAll(Arrays.asList(admin, teacher, student1, student2));

            // Seed Courses
            Course c1 = Course.builder()
                    .title("Introduction to Web Development")
                    .description("Learn HTML, CSS, JavaScript, and React from scratch in this beginner-friendly course.")
                    .category("Computer Science")
                    .teacher(teacher)
                    .build();

            Course c2 = Course.builder()
                    .title("Mastering Spring Boot & JPA")
                    .description("Deep dive into Spring Boot, REST APIs, JPA repositories, database configuration, and Spring Security.")
                    .category("Software Engineering")
                    .teacher(teacher)
                    .build();

            Course c3 = Course.builder()
                    .title("UX/UI Design Foundations")
                    .description("Understand visual hierarchy, spacing, modern typography, glassmorphism, and color theory to make applications look premium.")
                    .category("Design")
                    .teacher(teacher)
                    .build();

            courseRepository.saveAll(Arrays.asList(c1, c2, c3));

            // Seed Enrollments
            Enrollment e1 = Enrollment.builder()
                    .student(student1)
                    .course(c1)
                    .enrollmentDate(Instant.now().minus(2, ChronoUnit.DAYS))
                    .build();

            Enrollment e2 = Enrollment.builder()
                    .student(student2)
                    .course(c1)
                    .enrollmentDate(Instant.now().minus(1, ChronoUnit.DAYS))
                    .build();

            Enrollment e3 = Enrollment.builder()
                    .student(student1)
                    .course(c2)
                    .enrollmentDate(Instant.now().minus(3, ChronoUnit.HOURS))
                    .build();

            enrollmentRepository.saveAll(Arrays.asList(e1, e2, e3));

            System.out.println("--- Database Seeded Successfully ---");
        }
    }
}
