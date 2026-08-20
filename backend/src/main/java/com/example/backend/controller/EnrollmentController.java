package com.example.backend.controller;

import com.example.backend.dto.MessageResponse;
import com.example.backend.model.Course;
import com.example.backend.model.Enrollment;
import com.example.backend.model.User;
import com.example.backend.repository.CourseRepository;
import com.example.backend.repository.EnrollmentRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/enrolments")
public class EnrollmentController {

    @Autowired
    CourseRepository courseRepository;

    @Autowired
    EnrollmentRepository enrollmentRepository;

    @Autowired
    UserRepository userRepository;

    @PostMapping("/enroll")
    public ResponseEntity<?> enrollInCourse(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody Map<String, Long> payload
    ) {
        Long courseId = payload.get("courseId");
        if (courseId == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: courseId is required!"));
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Error: Course not found!"));

        User student = userRepository.findById(userDetails.getId()).get();

        if (enrollmentRepository.findByStudentAndCourse(student, course).isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Already enrolled in this course!"));
        }

        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .course(course)
                .enrollmentDate(Instant.now())
                .build();

        enrollmentRepository.save(enrollment);

        return ResponseEntity.ok(new MessageResponse("Enrolled in course successfully!"));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdrawFromCourse(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody Map<String, Long> payload
    ) {
        Long courseId = payload.get("courseId");
        if (courseId == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: courseId is required!"));
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Error: Course not found!"));

        User student = userRepository.findById(userDetails.getId()).get();

        Optional<Enrollment> enrollmentOpt = enrollmentRepository.findByStudentAndCourse(student, course);

        if (!enrollmentOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: You are not enrolled in this course!"));
        }

        enrollmentRepository.delete(enrollmentOpt.get());

        return ResponseEntity.ok(new MessageResponse("Withdrawn from course successfully!"));
    }
}
