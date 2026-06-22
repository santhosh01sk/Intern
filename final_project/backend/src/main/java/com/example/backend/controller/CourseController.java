package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.model.Course;
import com.example.backend.model.Enrollment;
import com.example.backend.model.Role;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @Autowired
    CourseRepository courseRepository;

    @Autowired
    EnrollmentRepository enrollmentRepository;

    @Autowired
    UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getCourses(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "title") String sortBy,
            @RequestParam(defaultValue = "asc") String sortOrder
    ) {
        // Scoped check for teacher role to return teacher's own courses
        if (userDetails != null) {
            Optional<User> userOpt = userRepository.findById(userDetails.getId());
            if (userOpt.isPresent() && userOpt.get().getRole() == Role.TEACHER) {
                User teacher = userOpt.get();

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
        }

        // Safe check for sort attributes to prevent syntax exceptions for students/admins
        String resolvedSortBy = sortBy;
        if ("teacherName".equals(sortBy) || "teacher".equals(sortBy)) {
            resolvedSortBy = "teacher.firstName";
        }

        Sort sort = Sort.by(Sort.Direction.fromString(sortOrder), resolvedSortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Course> coursePage = courseRepository.findAllFiltered(search, category, pageable);

        List<Long> enrolledCourseIds = new ArrayList<>();
        if (userDetails != null) {
            userRepository.findById(userDetails.getId()).ifPresent(user -> {
                if (user.getRole() == Role.STUDENT) {
                    List<Enrollment> enrollments = enrollmentRepository.findByStudent(user);
                    enrolledCourseIds.addAll(
                            enrollments.stream().map(e -> e.getCourse().getId()).collect(Collectors.toList())
                    );
                }
            });
        }

        List<CourseResponse> courseResponses = coursePage.getContent().stream()
                .map(c -> CourseResponse.builder()
                        .id(c.getId())
                        .title(c.getTitle())
                        .description(c.getDescription())
                        .category(c.getCategory())
                        .teacherName(c.getTeacher().getFirstName() + " " + c.getTeacher().getLastName())
                        .enrolled(enrolledCourseIds.contains(c.getId()))
                        .build())
                .collect(Collectors.toList());

        List<String> categories = courseRepository.findAll().stream()
                .map(Course::getCategory)
                .filter(cat -> cat != null && !cat.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        CoursePageResponse response = CoursePageResponse.builder()
                .courses(courseResponses)
                .currentPage(coursePage.getNumber())
                .totalPages(coursePage.getTotalPages())
                .totalElements(coursePage.getTotalElements())
                .categories(categories)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> createCourse(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody CourseCreateRequest request
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<User> userOpt = userRepository.findById(userDetails.getId());
        if (userOpt.isEmpty() || userOpt.get().getRole() != Role.TEACHER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("Error: Only teachers can create courses."));
        }

        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Title is required!"));
        }

        User teacher = userOpt.get();

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

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourse(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id,
            @RequestBody CourseUpdateRequest request
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

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
        long enrolledCount = enrollmentRepository.countByCourse(saved);

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

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

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
}
