package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.model.*;
import com.example.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired
    UserRepository userRepository;

    @Autowired
    CourseRepository courseRepository;

    @Autowired
    EnrollmentRepository enrollmentRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        long studentsCount = userRepository.countByRole(Role.STUDENT);
        long teachersCount = userRepository.countByRole(Role.TEACHER);
        long coursesCount = courseRepository.count();
        long enrollmentsCount = enrollmentRepository.count();

        // Get recent enrollments (latest 5)
        List<Enrollment> enrollments = enrollmentRepository.findAll();
        List<RecentEnrollmentInfo> recentEnrollments = enrollments.stream()
                .sorted((e1, e2) -> e2.getEnrollmentDate().compareTo(e1.getEnrollmentDate()))
                .limit(5)
                .map(e -> RecentEnrollmentInfo.builder()
                        .studentName(e.getStudent().getFirstName() + " " + e.getStudent().getLastName())
                        .studentEmail(e.getStudent().getEmail())
                        .courseTitle(e.getCourse().getTitle())
                        .enrollmentDate(e.getEnrollmentDate())
                        .build())
                .collect(Collectors.toList());

        // Enrollments per course
        List<Course> allCourses = courseRepository.findAll();
        List<AdminAnalyticsResponse.CourseEnrollmentStat> enrollmentsPerCourse = allCourses.stream()
                .map(c -> AdminAnalyticsResponse.CourseEnrollmentStat.builder()
                        .courseTitle(c.getTitle())
                        .enrollmentCount(enrollmentRepository.countByCourse(c))
                        .build())
                .collect(Collectors.toList());

        // Courses per teacher
        List<User> teachers = userRepository.findByRole(Role.TEACHER);
        List<AdminAnalyticsResponse.TeacherCourseStat> coursesPerTeacher = teachers.stream()
                .map(t -> AdminAnalyticsResponse.TeacherCourseStat.builder()
                        .teacherName(t.getFirstName() + " " + t.getLastName())
                        .courseCount(courseRepository.findByTeacher(t).size())
                        .build())
                .collect(Collectors.toList());

        // Popular categories
        List<AdminAnalyticsResponse.CategoryStat> popularCategories = allCourses.stream()
                .collect(Collectors.groupingBy(c -> c.getCategory() != null && !c.getCategory().trim().isEmpty() ? c.getCategory() : "General", Collectors.counting()))
                .entrySet().stream()
                .map(entry -> AdminAnalyticsResponse.CategoryStat.builder()
                        .category(entry.getKey())
                        .courseCount(entry.getValue())
                        .build())
                .collect(Collectors.toList());

        AdminAnalyticsResponse response = AdminAnalyticsResponse.builder()
                .totalStudents(studentsCount)
                .totalTeachers(teachersCount)
                .totalCourses(coursesCount)
                .totalEnrollments(enrollmentsCount)
                .recentEnrollments(recentEnrollments)
                .enrollmentsPerCourse(enrollmentsPerCourse)
                .coursesPerTeacher(coursesPerTeacher)
                .popularCategories(popularCategories)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/teachers")
    public ResponseEntity<?> getTeachersList() {
        List<User> teachers = userRepository.findByRole(Role.TEACHER);
        List<TeacherAnalyticsInfo> response = teachers.stream()
                .map(t -> {
                    List<Course> courses = courseRepository.findByTeacher(t);
                    List<String> courseTitles = courses.stream()
                            .map(Course::getTitle)
                            .collect(Collectors.toList());
                    
                    long totalStudents = courses.stream()
                            .mapToLong(c -> enrollmentRepository.countByCourse(c))
                            .sum();
                            
                    return TeacherAnalyticsInfo.builder()
                            .id(t.getId())
                            .firstName(t.getFirstName())
                            .lastName(t.getLastName())
                            .email(t.getEmail())
                            .courseTitles(courseTitles)
                            .totalStudents(totalStudents)
                            .specialization(t.getSpecialization())
                            .build();
                })
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(response);
    }

    @PostMapping("/teachers")
    public ResponseEntity<?> createTeacher(@RequestBody RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is required!"));
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Password is required!"));
        }
        if (userRepository.existsByEmail(request.getEmail().trim())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        User teacher = User.builder()
                .email(request.getEmail().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.TEACHER)
                .specialization(request.getSpecialization())
                .build();

        userRepository.save(teacher);
        return ResponseEntity.ok(new MessageResponse("Teacher created successfully."));
    }

    @PutMapping("/teachers/{id}")
    public ResponseEntity<?> updateTeacher(@PathVariable Long id, @RequestBody RegisterRequest request) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User teacher = userOpt.get();
        if (teacher.getRole() != Role.TEACHER) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Selected user is not a teacher."));
        }

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            String newEmail = request.getEmail().trim();
            if (!newEmail.equals(teacher.getEmail()) && userRepository.existsByEmail(newEmail)) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
            }
            teacher.setEmail(newEmail);
        }

        if (request.getFirstName() != null) {
            teacher.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            teacher.setLastName(request.getLastName());
        }
        if (request.getSpecialization() != null) {
            teacher.setSpecialization(request.getSpecialization());
        }
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            teacher.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        userRepository.save(teacher);
        return ResponseEntity.ok(new MessageResponse("Teacher updated successfully."));
    }

    @DeleteMapping("/teachers/{id}")
    public ResponseEntity<?> deleteTeacher(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User teacher = userOpt.get();
        if (teacher.getRole() != Role.TEACHER) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Selected user is not a teacher."));
        }

        List<Course> courses = courseRepository.findByTeacher(teacher);
        if (!courses.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageResponse("Cannot delete: Teacher is assigned to " + courses.size() + " course(s)."));
        }

        userRepository.delete(teacher);
        return ResponseEntity.ok(new MessageResponse("Teacher deleted successfully."));
    }
}
