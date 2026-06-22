package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.model.Course;
import com.example.backend.model.Enrollment;
import com.example.backend.model.User;
import com.example.backend.repository.CourseRepository;
import com.example.backend.repository.EnrollmentRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teacher")
public class TeacherController {

    @Autowired
    CourseRepository courseRepository;

    @Autowired
    EnrollmentRepository enrollmentRepository;

    @Autowired
    UserRepository userRepository;

    // ─── GET /api/teacher/courses — paginated, filtered, sorted ──────────────
    @GetMapping("/courses")
    public ResponseEntity<?> getTeacherCourses(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "title") String sortBy,
            @RequestParam(defaultValue = "asc") String sortOrder
    ) {
        User teacher = userRepository.findById(userDetails.getId()).get();

        // Validate sort field to prevent injection
        String resolvedSortBy = switch (sortBy) {
            case "category" -> "category";
            case "duration" -> "duration";
            case "enrolledCount" -> "title"; // enrolledCount is computed; fall back to title
            default -> "title";
        };

        Sort sort = Sort.by(Sort.Direction.fromString(sortOrder), resolvedSortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Course> coursePage = courseRepository.findAllFilteredByTeacher(teacher, search, category, pageable);

        List<TeacherCourseResponse> courseResponses = coursePage.getContent().stream()
                .map(c -> {
                    long count = enrollmentRepository.countByCourse(c);
                    return TeacherCourseResponse.builder()
                            .id(c.getId())
                            .title(c.getTitle())
                            .description(c.getDescription())
                            .category(c.getCategory())
                            .duration(c.getDuration())
                            .enrolledCount(count)
                            .build();
                })
                .collect(Collectors.toList());

        List<String> categories = courseRepository.findDistinctCategoriesByTeacher(teacher);

        TeacherCoursePageResponse response = TeacherCoursePageResponse.builder()
                .courses(courseResponses)
                .currentPage(coursePage.getNumber())
                .totalPages(coursePage.getTotalPages())
                .totalElements(coursePage.getTotalElements())
                .categories(categories)
                .build();

        return ResponseEntity.ok(response);
    }

    // ─── POST /api/teacher/courses — create ──────────────────────────────────
    @PostMapping("/courses")
    public ResponseEntity<?> createCourse(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody CourseCreateRequest request
    ) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Title is required!"));
        }

        User teacher = userRepository.findById(userDetails.getId()).get();

        Course course = Course.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .category(request.getCategory() != null ? request.getCategory().trim() : "General")
                .duration(request.getDuration())
                .teacher(teacher)
                .build();

        Course saved = courseRepository.save(course);

        TeacherCourseResponse resp = TeacherCourseResponse.builder()
                .id(saved.getId())
                .title(saved.getTitle())
                .description(saved.getDescription())
                .category(saved.getCategory())
                .duration(saved.getDuration())
                .enrolledCount(0)
                .build();

        return ResponseEntity.ok(resp);
    }

    // ─── PUT /api/teacher/courses/{id} — update ───────────────────────────────
    @PutMapping("/courses/{id}")
    public ResponseEntity<?> updateCourse(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id,
            @RequestBody CourseUpdateRequest request
    ) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Course course = courseOpt.get();

        // Ownership check — teacher can only edit their own courses
        if (!course.getTeacher().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("Error: You do not own this course."));
        }

        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            course.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            course.setDescription(request.getDescription());
        }
        if (request.getCategory() != null && !request.getCategory().trim().isEmpty()) {
            course.setCategory(request.getCategory().trim());
        }
        if (request.getDuration() != null) {
            course.setDuration(request.getDuration());
        }

        Course saved = courseRepository.save(course);
        long enrolledCount = enrollmentRepository.findByCourse(saved).size();

        TeacherCourseResponse resp = TeacherCourseResponse.builder()
                .id(saved.getId())
                .title(saved.getTitle())
                .description(saved.getDescription())
                .category(saved.getCategory())
                .duration(saved.getDuration())
                .enrolledCount(enrolledCount)
                .build();

        return ResponseEntity.ok(resp);
    }

    // ─── DELETE /api/teacher/courses/{id} — delete ────────────────────────────
    @DeleteMapping("/courses/{id}")
    public ResponseEntity<?> deleteCourse(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id
    ) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Course course = courseOpt.get();

        if (!course.getTeacher().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("Error: You do not own this course."));
        }

        List<Enrollment> enrollments = enrollmentRepository.findByCourse(course);
        if (!enrollments.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageResponse(
                            "Cannot delete: " + enrollments.size() + " student(s) are enrolled in this course."));
        }

        courseRepository.delete(course);
        return ResponseEntity.ok(new MessageResponse("Course deleted successfully."));
    }

    // ─── GET /api/teacher/courses/{id}/students — enrolled students ───────────
    @GetMapping("/courses/{id}/students")
    public ResponseEntity<?> getCourseStudents(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id
    ) {
        Optional<Course> courseOpt = courseRepository.findById(id);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Course course = courseOpt.get();

        if (!course.getTeacher().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("Error: You do not own this course."));
        }

        List<EnrolledStudentInfo> students = enrollmentRepository.findByCourse(course).stream()
                .map(e -> EnrolledStudentInfo.builder()
                        .id(e.getStudent().getId())
                        .firstName(e.getStudent().getFirstName())
                        .lastName(e.getStudent().getLastName())
                        .email(e.getStudent().getEmail())
                        .enrollmentDate(e.getEnrollmentDate())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(students);
    }
}
