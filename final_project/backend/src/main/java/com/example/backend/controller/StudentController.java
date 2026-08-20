package com.example.backend.controller;

import com.example.backend.dto.CourseResponse;
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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student")
public class StudentController {
    @Autowired
    CourseRepository courseRepository;

    @Autowired
    EnrollmentRepository enrollmentRepository;

    @Autowired
    UserRepository userRepository;

    @GetMapping("/courses")
    public ResponseEntity<?> getCourses(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User student = userRepository.findById(userDetails.getId()).get();
        List<Course> allCourses = courseRepository.findAll();
        List<Enrollment> studentEnrollments = enrollmentRepository.findByStudent(student);

        List<Long> enrolledCourseIds = studentEnrollments.stream()
                .map(e -> e.getCourse().getId())
                .collect(Collectors.toList());

        List<CourseResponse> response = allCourses.stream()
                .map(c -> CourseResponse.builder()
                        .id(c.getId())
                        .title(c.getTitle())
                        .description(c.getDescription())
                        .teacherName(c.getTeacher().getFirstName() + " " + c.getTeacher().getLastName())
                        .enrolled(enrolledCourseIds.contains(c.getId()))
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/enroll")
    public ResponseEntity<?> enrollInCourse(@AuthenticationPrincipal UserDetailsImpl userDetails, @RequestBody Map<String, Long> payload) {
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

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserDetailsImpl userDetails, @RequestBody Map<String, String> payload) {
        String firstName = payload.get("firstName");
        String lastName = payload.get("lastName");
        String email = payload.get("email");

        if (firstName == null || firstName.trim().isEmpty() || lastName == null || lastName.trim().isEmpty() || email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: All fields are required!"));
        }

        User student = userRepository.findById(userDetails.getId()).get();
        
        java.util.Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent() && !existingUser.get().getId().equals(student.getId())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        student.setFirstName(firstName);
        student.setLastName(lastName);
        student.setEmail(email);

        userRepository.save(student);

        return ResponseEntity.ok(new MessageResponse("Profile updated successfully!"));
    }
}
